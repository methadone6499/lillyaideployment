import type { DosagePreviewScheduleRow } from "../data/dosageCalculatorFixtures";

type TitrationScheduleProps = {
  rows: readonly DosagePreviewScheduleRow[];
};

export function TitrationSchedule({ rows }: TitrationScheduleProps) {
  return (
    <section aria-labelledby="titration-schedule-heading">
      <h3
        id="titration-schedule-heading"
        className="px-6 pb-3 pt-5 text-card-title font-medium text-white"
      >
        Titration schedule
      </h3>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-170 border-collapse text-left">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[21%]" />
            <col className="w-[39%]" />
          </colgroup>
          <thead className="bg-surface-subtle text-label text-text-step">
            <tr>
              <th className="px-6 py-2.5 font-medium" scope="col">
                Week
              </th>
              <th className="px-6 py-2.5 font-medium" scope="col">
                Dose
              </th>
              <th className="px-6 py-2.5 font-medium" scope="col">
                Route
              </th>
              <th className="px-6 py-2.5 font-medium" scope="col">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.week}
                className="border-b border-border-default last:border-b-0"
              >
                <th
                  className="px-6 py-4.75 text-label font-medium text-white"
                  scope="row"
                >
                  {row.week}
                </th>
                <td className="px-6 py-4.75 text-label font-medium text-white">
                  {row.dose}
                </td>
                <td className="px-6 py-4.75 text-label font-medium text-white">
                  {row.route}
                </td>
                <td className="px-6 py-4.75 text-helper text-text-body">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
