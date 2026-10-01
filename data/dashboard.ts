export type AttentionTask={id:string;title:string;owner:string;due:string;priority:'High'|'Medium'|'Low';href:string};
export type FindingExposure={label:string;count:number;key:'major'|'minor'|'observation'|'ofi'};
export type FindingAge={label:string;count:number;risk?:boolean};
export const attentionTasks:AttentionTask[]=[
 {id:'FND-2026-031',title:'Finding response overdue',owner:'Siva Kumar',due:'5 days overdue',priority:'High',href:'/findings?record=FND-2026-031'},
 {id:'ACT-2026-018',title:'Corrective action verification due',owner:'Lakshman',due:'Due today',priority:'High',href:'/actions?record=ACT-2026-018'},
 {id:'AUD-2026-024',title:'Audit completion overdue',owner:'Anand',due:'3 days overdue',priority:'Medium',href:'/audits/AUD-2026-024'},
 {id:'FND-2026-028',title:'Root cause analysis pending',owner:'Manoj',due:'Due Sep 10',priority:'Medium',href:'/findings?record=FND-2026-028'},
 {id:'ACT-2026-021',title:'Evidence submission pending',owner:'Rumesh',due:'Due Sep 11',priority:'Low',href:'/actions?record=ACT-2026-021'}
];
export const performance6=[{month:'Apr',completed:5,score:81},{month:'May',completed:6,score:83},{month:'Jun',completed:4,score:80},{month:'Jul',completed:7,score:85},{month:'Aug',completed:8,score:86},{month:'Sep',completed:6,score:88}];
export const performance12=[{month:'Oct',completed:4,score:78},{month:'Nov',completed:5,score:80},{month:'Dec',completed:7,score:82},{month:'Jan',completed:3,score:79},{month:'Feb',completed:5,score:81},{month:'Mar',completed:6,score:83},...performance6];
export const findings:FindingExposure[]=[{label:'Major NC',count:3,key:'major'},{label:'Minor NC',count:8,key:'minor'},{label:'Observation',count:14,key:'observation'},{label:'Opportunity for Improvement',count:6,key:'ofi'}];
export const findingAge:FindingAge[]=[{label:'0–7 days',count:12},{label:'8–15 days',count:8},{label:'16–30 days',count:6},{label:'> 30 days',count:5,risk:true}];
