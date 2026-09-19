import { useCallback } from "react";
import { usePersistentState } from "@/shared/hooks/usePersistentState";

export type MarketingBriefing = {
  id:string; title:string; type:string; status:string; deadline:string; owners:string[]; objective:string; context:string; audience:string;
  positioning:string; tone:string; requirements:string; creativeDirection:string; references:string; visualGuidelines:string; textGuidelines:string;
  market:string; competitors:string; trends:string; channels:string[]; restrictions:string; resources:string; expectations:string; deliverables:string[];
  timeline:string; executionPlan:string; aiRecommendations:string;
};
export type MarketingCampaign = { id:string; name:string; targetType:string; targetName:string; type:string; status:string; owner:string; budget:number; startDate:string; endDate:string; objective:string; audience:string; segmentation:string; platforms:string[]; notes:string; metrics:{reach:number;impressions:number;engagement:number;clicks:number;conversions:number;roi:number;costPerResult:number} };
export type MarketingContent = {
  id:string; title:string; targetType:string; targetName:string; type:string; channel:string; channels?:string[]; status:string; approval:string;
  publishDate:string; publishTime:string; owner:string; copy:string; notes:string; campaignId?:string; hashtags?:string; location?:string;
  integratedAccountId?:string; mediaName?:string; mediaUrl?:string;
};

export type MarketingTaskStatus = "Backlog" | "Planned" | "In Progress" | "In Review" | "Blocked" | "Completed";
export type MarketingTaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type MarketingTaskApproval = "Not Required" | "Pending" | "Approved" | "Changes Requested";
export type MarketingTask = {
  id:string;
  title:string;
  workstream:string;
  status:MarketingTaskStatus;
  priority:MarketingTaskPriority;
  owner:string;
  reviewer:string;
  deadline:string;
  description:string;
  deliverable:string;
  campaignId:string;
  briefingId:string;
  contentId:string;
  channels:string[];
  approval:MarketingTaskApproval;
  referenceUrl:string;
  checklist:Array<{id:string;label:string;done:boolean}>;
};

export type MarketingState = {
  briefings:MarketingBriefing[];
  campaigns:MarketingCampaign[];
  contents:MarketingContent[];
  tasks:MarketingTask[];
  aiHistory:Array<{id:string;kind:string;prompt:string;output:string;createdAt:string}>;
};

const INITIAL: MarketingState = { briefings:[], campaigns:[], contents:[], tasks:[], aiHistory:[] };

function normalizeMarketingState(value: MarketingState): MarketingState {
  const current = value ?? INITIAL;
  return {
    ...INITIAL,
    ...current,
    briefings: current.briefings ?? [],
    campaigns: current.campaigns ?? [],
    contents: current.contents ?? [],
    tasks: current.tasks ?? [],
    aiHistory: current.aiHistory ?? [],
  };
}

export function useMarketingState(){
  const [stored,setStored]=usePersistentState<MarketingState>("lander:marketing-state", INITIAL);
  const state=normalizeMarketingState(stored);
  const setState=useCallback((next:MarketingState|((current:MarketingState)=>MarketingState))=>{
    setStored(current=>{
      const normalized=normalizeMarketingState(current);
      return normalizeMarketingState(typeof next==="function"?next(normalized):next);
    });
  },[setStored]);
  return [state,setState] as const;
}

export const BRIEFING_TYPES=["Campaign","Content","Brand","Launch","Institutional","Other"];
export const BRIEFING_STATUSES=["Draft","In Review","Approved","Completed"];
export const CAMPAIGN_TYPES=["Institutional","Launch","Performance","Awareness","Remarketing","Lead Generation","Other"];
export const CAMPAIGN_STATUSES=["Draft","Planned","Active","Paused","Completed","Cancelled"];
export const CONTENT_TYPES=["Social Media","Feed Post","Story","Reel / Short Video","Long Video","Carousel","Article","Email","Ad Creative","Landing Page","Other"];
export const CONTENT_CHANNELS=["Instagram","Facebook","TikTok","YouTube","Google Ads","Email","Website","LinkedIn"];
export const CONTENT_STATUSES=["Idea","Draft","In Review","Scheduled","Published","Cancelled"];
export const APPROVAL_STATUSES=["Pending","Approved","Changes Requested"];
export const TARGET_TYPES=["Company","Carrier","Broker","Customer","Load"];
export const MARKETING_TASK_STATUSES:MarketingTaskStatus[]=["Backlog","Planned","In Progress","In Review","Blocked","Completed"];
export const MARKETING_TASK_PRIORITIES:MarketingTaskPriority[]=["Low","Medium","High","Urgent"];
export const MARKETING_TASK_APPROVALS:MarketingTaskApproval[]=["Not Required","Pending","Approved","Changes Requested"];
export const MARKETING_WORKSTREAMS=["Strategy","Creative","Content","Social Media","Paid Media","Email","Website","Analytics","Approval","Other"];
