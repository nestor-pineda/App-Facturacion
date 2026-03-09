import { cn } from "@/lib/utils";
import { ESTADO_BORRADOR, ESTADO_ENVIADA, ESTADO_ENVIADO } from "@/lib/constants";
import type { EstadoDocument } from "@/types/enums";

const statusStyles: Record<EstadoDocument, string> = {
  [ESTADO_BORRADOR]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [ESTADO_ENVIADA]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [ESTADO_ENVIADO]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusLabels: Record<EstadoDocument, string> = {
  [ESTADO_BORRADOR]: "Borrador",
  [ESTADO_ENVIADA]: "Enviada",
  [ESTADO_ENVIADO]: "Enviado",
};

export function StatusBadge({ status }: { status: EstadoDocument }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
