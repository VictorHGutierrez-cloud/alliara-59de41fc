import type { ActionRow } from "@/lib/partners-store";
import type { AgentTask } from "@/components/ui/agent-plan";

export type ActionWithPartnerMeta = ActionRow & {
  partner_name: string;
  partner_company?: string | null;
};

export function actionRowToAgentTask(
  action: ActionRow,
  opts?: {
    /** When true, show link to partner plan and pass partner fields */
    includePartnerContext?: boolean;
    partnerName?: string;
    partnerCompany?: string | null;
    /** Set when you need partnerId for actions (e.g. email) without full partner link chrome */
    partnerId?: string;
    canMutate?: boolean;
  },
): AgentTask {
  const include = opts?.includePartnerContext === true;
  return {
    id: action.id,
    title: action.title,
    description: action.description ?? undefined,
    status: action.status,
    priority: action.priority,
    axisKey: action.axis_key,
    dueDate: action.due_date,
    targetLevel: action.target_level,
    source: action.source,
    partnerId: include ? action.partner_id : opts?.partnerId,
    partnerName: include ? (opts?.partnerName ?? "") : undefined,
    partnerCompany: include ? (opts?.partnerCompany ?? undefined) : undefined,
    canMutate: opts?.canMutate,
  };
}
