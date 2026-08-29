import { usePersistentState } from "@/shared/hooks/usePersistentState";

export type MarketingBriefing = {
  id:string; title:string; type:string; status:string; deadline:string; owners:string[]; objective:string; context:string; audience:string;
  positioning:string; tone:string; requirements:string; creativeDirection:string; references:string; visualGuidelines:string; textGuidelines:string;
  market:string; competitors:string; trends:string; channels:string[]; restrictions:string; resources:string; expectations:string; deliverables:string[];
  timeline:string; executionPlan:string; aiRecommendations:string;
};
export type MarketingCampaign = { id:string; name:string; targetType:string; targetName:string; type:string; status:string; owner:string; budget:number; startDate:string; endDate:string; objective:string; audience:string; segmentation:string; platforms:string[]; notes:string; metrics:{reach:number;impressions:number;engagement:number;clicks:number;conversions:number;roi:number;costPerResult:number} };
export type MarketingContent = { id:string; title:string; targetType:string; targetName:string; type:string; channel:string; status:string; approval:string; publishDate:string; publishTime:string; owner:string; copy:string; notes:string };
export type MarketingState = { briefings:MarketingBriefing[]; campaigns:MarketingCampaign[]; contents:MarketingContent[]; aiHistory:Array<{id:string;kind:string;prompt:string;output:string;createdAt:string}> };
const INITIAL: MarketingState = { briefings:[], campaigns:[], contents:[], aiHistory:[] };
export function useMarketingState(){ return usePersistentState<MarketingState>("lander:marketing-state", INITIAL); }

export const BRIEFING_TYPES=["Campaign","Content","Brand","Launch","Institutional","Other"];
export const BRIEFING_STATUSES=["Draft","In Review","Approved","Completed"];
export const CAMPAIGN_TYPES=["Institutional","Launch","Performance","Awareness","Remarketing","Lead Generation","Other"];
export const CAMPAIGN_STATUSES=["Draft","Planned","Active","Paused","Completed","Cancelled"];
export const CONTENT_TYPES=["Social Media","Video","Article","Email","Ad Creative","Landing Page","Other"];
export const CONTENT_CHANNELS=["Instagram","Facebook","TikTok","YouTube","Google Ads","Email","Website","LinkedIn"];
export const CONTENT_STATUSES=["Idea","Draft","In Review","Scheduled","Published","Cancelled"];
export const APPROVAL_STATUSES=["Pending","Approved","Changes Requested"];
export const TARGET_TYPES=["Company","Carrier","Broker","Customer","Load"];
