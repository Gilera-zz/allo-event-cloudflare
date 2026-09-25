// Designad reservyta i produktionsspråket när en bild saknas: rutnät, etikett, typografi.
// Inget falskt foto.

export type PlanCopy = { code: string; word: string; note: string; scale: string };

export function PlanPlaceholder({ copy, small = false }: { copy: PlanCopy; small?: boolean }) {
  return (
    <div className={`allo-v7-plan ${small ? "allo-v7-plan--small" : ""}`} aria-hidden="true">
      <span className="allo-v7-mono allo-v7-plan-code">{copy.code}</span>
      {copy.scale ? <span className="allo-v7-mono allo-v7-plan-scale">{copy.scale}</span> : null}
      {copy.note ? <span className="allo-v7-mono allo-v7-plan-note">{copy.note}</span> : null}
      <span className="allo-v7-plan-line" />
      <span className="allo-v7-plan-word">{copy.word}</span>
    </div>
  );
}
