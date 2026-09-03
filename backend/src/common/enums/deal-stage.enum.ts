export enum DealStage {
  NEW = 'new',
  CONTACTED = 'contacted',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

// Display order for the Kanban board — WON/LOST are outcomes, kept at
// the end rather than sorted alphabetically.
export const DEAL_STAGE_ORDER: DealStage[] = [
  DealStage.NEW,
  DealStage.CONTACTED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.WON,
  DealStage.LOST,
];
