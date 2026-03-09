import { cn } from "@/lib/utils";
import { ESTADO_BORRADOR, ESTADO_ENVIADA, ESTADO_ENVIADO } from "@/lib/constants";
import type { EstadoDocument } from "@/types/enums";
import { useTranslation } from "react-i18next";

const statusStyles: Record<EstadoDocument, string> = {
  [ESTADO_BORRADOR]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [ESTADO_ENVIADA]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [ESTADO_ENVIADO]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function StatusBadge({ status }: { status: EstadoDocument }) {
  const { t } = useTranslation();

  const statusLabels: Record<EstadoDocument, string> = {
    [ESTADO_BORRADOR]: t('status.draft'),
    [ESTADO_ENVIADA]: t('status.sent_f'),
    [ESTADO_ENVIADO]: t('status.sent_m'),
  };

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
