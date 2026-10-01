export type AuditProgramStatus='Active'|'Completed'|'Draft'|'Archived';
export type AuditFrequency='One Time'|'Weekly'|'Annual'|'Semi-Annual'|'Quarterly'|'Monthly'|'Custom';
export type AuditProgram={id:string;name:string;description:string;status:AuditProgramStatus;startDate:string;endDate:string;period:string;owner:string;locations:string[];businessLineIds?:string[];departments:string[];auditTypes:string[];frequency:AuditFrequency;auditIds:string[];lastUpdated:string;created:string};
export type AuditScheduleItem={auditId:string;duration:string;checklist:string};
export type ProgramActivity={id:string;date:string;time:string;actor:string;action:string};

const internalAuditIds=['AUD-2026-026','AUD-2026-027','AUD-2026-028','AUD-2026-029','AUD-2026-030','AUD-2026-025','AUD-2026-024','AUD-2026-023','AUD-2026-022','AUD-2026-021','AUD-2026-020','AUD-2026-019','AUD-2026-018','AUD-2026-017','AUD-2026-016'];

export const auditPrograms:AuditProgram[]=[
 {id:'PRG-2026-001',name:'2026 Internal Audit Program',description:'Organization-wide internal audit plan supporting the 2026 QMS assurance cycle.',status:'Active',startDate:'2026-01-01',endDate:'2026-12-31',period:'Jan 01 – Dec 31, 2026',owner:'Rumesh Ravi',locations:['Chennai Plant','Hosur Plant','Pune Plant'],departments:['Quality','Production','Maintenance','Warehouse','Engineering','Supplier Quality'],auditTypes:['Internal Audit','Process Audit','System Audit','Compliance Audit'],frequency:'Quarterly',auditIds:internalAuditIds,lastUpdated:'Sep 08, 2026',created:'Dec 12, 2025'},
 {id:'PRG-2026-002',name:'Supplier Audit Program — 2026',description:'Risk-based supplier quality assurance program.',status:'Active',startDate:'2026-01-01',endDate:'2026-12-31',period:'Jan 01 – Dec 31, 2026',owner:'Lakshman',locations:['Chennai Plant','Hosur Plant'],departments:['Supplier Quality','Quality'],auditTypes:['Supplier Audit'],frequency:'Quarterly',auditIds:['AUD-2026-028','AUD-2026-018'],lastUpdated:'Sep 06, 2026',created:'Dec 18, 2025'},
 {id:'PRG-2026-003',name:'ISO 9001 Surveillance Program',description:'Focused surveillance program for ISO 9001 controls.',status:'Active',startDate:'2026-04-01',endDate:'2026-09-30',period:'Apr 01 – Sep 30, 2026',owner:'Manoj',locations:['Chennai Plant','Hosur Plant','Pune Plant'],departments:['Quality','Production','Engineering'],auditTypes:['System Audit','Compliance Audit'],frequency:'Semi-Annual',auditIds:['AUD-2026-030','AUD-2026-020','AUD-2026-017'],lastUpdated:'Sep 04, 2026',created:'Mar 12, 2026'},
 {id:'PRG-2025-001',name:'2025 Internal Audit Program',description:'Completed annual internal audit program.',status:'Completed',startDate:'2025-01-01',endDate:'2025-12-31',period:'Jan 01 – Dec 31, 2025',owner:'Anand',locations:['Chennai Plant','Hosur Plant','Pune Plant'],departments:['Quality','Production','Maintenance'],auditTypes:['Internal Audit','System Audit'],frequency:'Annual',auditIds:['AUD-2025-041'],lastUpdated:'Jan 10, 2026',created:'Dec 10, 2024'}
 ,{id:'PRG-2027-001',name:'Quarterly Supplier Quality Review',description:'Quarterly supplier performance and incoming quality review program.',status:'Active',startDate:'2027-01-15',endDate:'2027-12-31',period:'Jan 15 – Dec 31, 2027',owner:'Manoj',locations:['Chennai Plant'],businessLineIds:['BL-INDUSTRIAL'],departments:['Supplier Quality'],auditTypes:['Supplier Audit'],frequency:'Quarterly',auditIds:['AUD-2027-001','AUD-2027-002','AUD-2027-003','AUD-2027-004'],lastUpdated:'Sep 09, 2026',created:'Sep 09, 2026'}
];

export const scheduleMeta:AuditScheduleItem[]=internalAuditIds.map((auditId,index)=>({auditId,duration:index===0?'3 days':index===4?'2 days':'1 day',checklist:index===1?'Manufacturing Process Checklist':'QMS Internal Audit Checklist'}));
export const programActivity:ProgramActivity[]=[
 {id:'ACT-1',date:'Sep 08',time:'10:32 AM',actor:'Rumesh Ravi',action:'updated the program schedule.'},
 {id:'ACT-2',date:'Sep 07',time:'04:18 PM',actor:'Lakshman',action:'was assigned to AUD-2026-030.'},
 {id:'ACT-3',date:'Sep 05',time:'11:05 AM',actor:'AUD-2026-028',action:'was added to the program by Rumesh Ravi.'},
 {id:'ACT-4',date:'Sep 01',time:'09:14 AM',actor:'Program status',action:'changed from Draft to Active.'}
];
