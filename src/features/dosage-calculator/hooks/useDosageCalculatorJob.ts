"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isDosageCalculatorResultReady,
  type DosageCalculatorEnqueueResponse,
  type DosageCalculatorRequest,
} from "../schemas/dosageCalculatorSchemas";
import {
  classifyDosageCalculatorError,
  getDosageCalculatorFailedJobError,
} from "../utils/classifyDosageCalculatorError";
import { clearDosageCalculatorJobQueries } from "../utils/clearDosageCalculatorSession";
import { useDosageCalculationResult } from "./useDosageCalculationResult";
import { useDosageCalculationStatus } from "./useDosageCalculationStatus";
import { useEnqueueDosageCalculationMutation } from "./useEnqueueDosageCalculationMutation";

export function useDosageCalculatorJob() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const enqueueAbortRef = useRef<AbortController | null>(null);
  const enqueueMutation = useEnqueueDosageCalculationMutation();
  const { mutateAsync, reset: resetEnqueueMutation } = enqueueMutation;
  const statusQuery = useDosageCalculationStatus(jobId);
  const resultQuery = useDosageCalculationResult(
    jobId,
    statusQuery.data?.job_status,
  );

  const abortEnqueue = useCallback(() => {
    enqueueAbortRef.current?.abort();
    enqueueAbortRef.current = null;
  }, []);

  const reset = useCallback(async () => {
    abortEnqueue();
    resetEnqueueMutation();

    const previousJobId = jobIdRef.current;
    jobIdRef.current = null;
    setJobId(null);

    if (previousJobId) {
      await clearDosageCalculatorJobQueries(queryClient, previousJobId);
    }
  }, [abortEnqueue, queryClient, resetEnqueueMutation]);

  const start = useCallback(
    async (
      request: DosageCalculatorRequest,
    ): Promise<DosageCalculatorEnqueueResponse> => {
      await reset();

      const controller = new AbortController();
      enqueueAbortRef.current = controller;

      try {
        const queued = await mutateAsync({
          request,
          signal: controller.signal,
        });

        jobIdRef.current = queued.job_id;
        setJobId(queued.job_id);
        return queued;
      } catch (error) {
        if (enqueueAbortRef.current === controller) {
          enqueueAbortRef.current = null;
        }
        throw error;
      }
    },
    [mutateAsync, reset],
  );

  useEffect(() => {
    return () => {
      abortEnqueue();
      const previousJobId = jobIdRef.current;
      jobIdRef.current = null;
      if (previousJobId) {
        void clearDosageCalculatorJobQueries(queryClient, previousJobId);
      }
    };
  }, [abortEnqueue, queryClient]);

  const jobStatus = statusQuery.data?.job_status;
  const error = classifyDosageCalculatorError(
    enqueueMutation.error ??
      statusQuery.error ??
      getDosageCalculatorFailedJobError(statusQuery.data) ??
      resultQuery.error,
  );

  return {
    jobId,
    enqueueMutation,
    statusQuery,
    resultQuery,
    error,
    isEnqueueing: enqueueMutation.isPending,
    isPolling:
      Boolean(jobId) &&
      !isDosageCalculatorResultReady(jobStatus) &&
      jobStatus !== "failed" &&
      !statusQuery.isError,
    isCompleted:
      isDosageCalculatorResultReady(jobStatus) && resultQuery.isSuccess,
    start,
    reset,
  };
}
