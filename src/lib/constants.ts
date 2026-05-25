import type { TimeOfDay, SwatchColor, IconName, AccentKey, AccentDef, WeekDay, HistoryDay, Medication } from "./types";

export const SWATCH_ORDER: SwatchColor[] = ["coral","sand","sage","blue","amber","mauve","olive","blush"];
export const ICON_ORDER: IconName[] = ["pill","capsule","droplet","sun","shield","heart","eye","leaf","flask","syringe"];

export const TIMES: { key: TimeOfDay; label: string }[] = [
  { key: "morning",   label: "Morning"   },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening",   label: "Evening"   },
  { key: "night",     label: "Night"     },
];

export const ACCENTS: Record<AccentKey, AccentDef> = {
  coral:  { c: "#ff6a47", ink: "#ffffff", h: 35  },
  indigo: { c: "#5d6cff", ink: "#ffffff", h: 268 },
  lime:   { c: "#6fcb3c", ink: "#0d1f06", h: 137 },
  pink:   { c: "#ff4f8f", ink: "#ffffff", h: 5   },
};

export const SEED_MEDS: Medication[] = [
  { id:"m1", name:"Vitamin D3",    dose:"1000 IU", times:["morning"],   note:"with breakfast",     icon:"sun",     color:"amber", status:"taken",  takenAt:"07:42", timer: null },
  { id:"m2", name:"Pantoprazole",  dose:"40 mg",   times:["morning"],   note:"30 min before food", icon:"shield",  color:"coral", status:"timing", takenAt:"08:18", timer:{ minutes:30, message:"You can eat now", remaining:27*60+14 } },
  { id:"m3", name:"Metformin",     dose:"500 mg",  times:["morning"],   note:"with food",          icon:"pill",    color:"sand",  status:"pending", timer: null },
  { id:"m4", name:"Levothyroxine", dose:"50 mcg",  times:["afternoon"], note:"on empty stomach",   icon:"capsule", color:"blush", status:"done",   takenAt:"13:04", timer:{ minutes:30, message:"You can eat now", remaining:0 } },
  { id:"m5", name:"Sertraline",    dose:"25 mg",   times:["afternoon"], note:"",                   icon:"droplet", color:"mauve", status:"pending", timer: null },
  { id:"m6", name:"Atorvastatin",  dose:"20 mg",   times:["evening"],   note:"",                   icon:"heart",   color:"sage",  status:"pending", timer: null },
  { id:"m7", name:"Melatonin",     dose:"5 mg",    times:["night"],     note:"30 min before bed",  icon:"leaf",    color:"blue",  status:"pending", timer: null },
];

export const WEEK_STRIP: WeekDay[] = [
  { d:"Sun", date:"17", status:"complete" },
  { d:"Mon", date:"18", status:"complete" },
  { d:"Tue", date:"19", status:"partial"  },
  { d:"Wed", date:"20", status:"complete" },
  { d:"Thu", date:"21", status:"missed"   },
  { d:"Fri", date:"22", status:"partial"  },
  { d:"Sat", date:"23", status:"today"    },
];

export const HISTORY_DAYS: HistoryDay[] = [
  { id:"d22", label:"Yesterday", sub:"Fri, May 22", summary:"5 of 7 taken",
    entries:[
      { icon:"sun",     color:"amber", name:"Vitamin D3",    dose:"1000 IU", at:"07:31" },
      { icon:"shield",  color:"coral", name:"Pantoprazole",  dose:"40 mg",   at:"08:02" },
      { icon:"pill",    color:"sand",  name:"Metformin",     dose:"500 mg",  at:"08:35" },
      { icon:"capsule", color:"blush", name:"Levothyroxine", dose:"50 mcg",  at:"missed" },
      { icon:"droplet", color:"mauve", name:"Sertraline",    dose:"25 mg",   at:"14:18" },
      { icon:"heart",   color:"sage",  name:"Atorvastatin",  dose:"20 mg",   at:"21:04" },
      { icon:"leaf",    color:"blue",  name:"Melatonin",     dose:"5 mg",    at:"missed" },
    ]},
  { id:"d21", label:"Thursday", sub:"May 21", summary:"3 of 7 taken",
    entries:[
      { icon:"sun",     color:"amber", name:"Vitamin D3",    dose:"1000 IU", at:"08:11" },
      { icon:"shield",  color:"coral", name:"Pantoprazole",  dose:"40 mg",   at:"missed" },
      { icon:"pill",    color:"sand",  name:"Metformin",     dose:"500 mg",  at:"09:00" },
      { icon:"capsule", color:"blush", name:"Levothyroxine", dose:"50 mcg",  at:"missed" },
      { icon:"droplet", color:"mauve", name:"Sertraline",    dose:"25 mg",   at:"missed" },
      { icon:"heart",   color:"sage",  name:"Atorvastatin",  dose:"20 mg",   at:"20:46" },
      { icon:"leaf",    color:"blue",  name:"Melatonin",     dose:"5 mg",    at:"missed" },
    ]},
  { id:"d20", label:"Wednesday", sub:"May 20", summary:"7 of 7 taken",
    entries:[
      { icon:"sun",     color:"amber", name:"Vitamin D3",    dose:"1000 IU", at:"07:14" },
      { icon:"shield",  color:"coral", name:"Pantoprazole",  dose:"40 mg",   at:"07:45" },
      { icon:"pill",    color:"sand",  name:"Metformin",     dose:"500 mg",  at:"08:30" },
      { icon:"capsule", color:"blush", name:"Levothyroxine", dose:"50 mcg",  at:"13:00" },
      { icon:"droplet", color:"mauve", name:"Sertraline",    dose:"25 mg",   at:"13:55" },
      { icon:"heart",   color:"sage",  name:"Atorvastatin",  dose:"20 mg",   at:"21:11" },
      { icon:"leaf",    color:"blue",  name:"Melatonin",     dose:"5 mg",    at:"22:40" },
    ]},
];
