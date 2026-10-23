"use client";
import { useState } from "react";
import { Button, Checkbox, ModalDialog } from "@/components/ui";
import { formatDisplayCount } from "@/lib/formatDisplay";
import { closeTopUpForfeiturePrompt, useTopUpForfeitureStore } from "../store/useTopUpForfeitureStore";

function Confirmation({ balance }: { balance: number }) {
  const [checked, setChecked] = useState(false);
  const acknowledgement = `I understand that my ${formatDisplayCount(balance)} unused personal report top-ups will be permanently removed.`;
  return <ModalDialog title="Personal additional reports will be lost" onClose={() => closeTopUpForfeiturePrompt(false)}>
    <div className="flex flex-col gap-5">
      <p className="text-label text-text-body">Moving to an Enterprise or Custom company subscription permanently removes your {formatDisplayCount(balance)} unused personal top-ups. They cannot be transferred to the company pool.</p>
      <div className="flex items-start gap-3 text-label text-text-body"><Checkbox checked={checked} onChange={setChecked} aria-label={acknowledgement} /><p>{acknowledgement}</p></div>
      <div className="flex flex-wrap gap-3"><Button variant="destructiveSolid" disabled={!checked} onClick={() => closeTopUpForfeiturePrompt(true)}>Confirm loss and continue</Button><Button variant="secondary" onClick={() => closeTopUpForfeiturePrompt(false)}>Keep personal reports</Button></div>
    </div>
  </ModalDialog>;
}
export function TopUpForfeitureConfirmation() {
  const prompt = useTopUpForfeitureStore((state) => state.prompt);
  return prompt ? <Confirmation key={prompt.id} balance={prompt.balance} /> : null;
}
