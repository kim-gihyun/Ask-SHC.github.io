export function clarifyQuestion(query:string,hasHistory:boolean):string|null{
 if(hasHistory)return null;
 if(/^(?:hi|hello|hey|help|\?|what can you do|help me)[!? .]*$/i.test(query))return 'I can help you find information about SHC and JCSV III. Ask about tutors, student teams, visitors, facilities, admissions or fees. What would you like to know?';
 if(/^(?:(?:how|where) (?:do|can) i |can i |i (?:want|need) to )?(?:book|reserve) (?:a |the )?room[?!. ]*$/i.test(query))return 'Do you mean applying for a residential room, or booking a function/meeting room for an activity? The procedures are different.';
 return null;
}
