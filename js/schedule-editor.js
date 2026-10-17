(()=>{
  const $=id=>document.getElementById(id);
  const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  function timeValue(value){
    return value.length===4?"0"+value:value;
  }

  function minutes(value){
    const [hours,minute]=value.split(":").map(Number);
    return hours*60+minute;
  }

  function showList(){
    $("editorTitle").textContent="Edit schedule";
    $("classListView").classList.remove("hidden");
    $("classForm").classList.add("hidden");
    $("editorError").textContent="";
    renderList();
  }

  function renderList(){
    const list=$("managedClasses");
    list.replaceChildren();
    const classes=window.scheduleEditorAPI.getClasses().sort((a,b)=>
      DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||
      minutes(a.startTime)-minutes(b.startTime)||
      a.course.localeCompare(b.course)
    );
    if(!classes.length){
      const empty=document.createElement("p");
      empty.className="editor-intro";
      empty.textContent="No classes in the timetable yet.";
      list.append(empty);
    }
    for(const item of classes){
      const row=document.createElement("article");
      row.className="managed-class";
      const info=document.createElement("div");
      info.className="managed-class-info";
      const name=document.createElement("strong");
      name.textContent=item.course;
      const details=document.createElement("span");
      details.textContent=[item.courseCode,item.day,item.startTime+"–"+item.endTime,item.group].filter(Boolean).join(" · ");
      info.append(name,details);
      const controls=document.createElement("div");
      controls.className="managed-class-actions";
      const edit=document.createElement("button");
      edit.type="button";
      edit.className="secondary";
      edit.textContent="Edit";
      edit.onclick=()=>showForm(item);
      const remove=document.createElement("button");
      remove.type="button";
      remove.className="danger";
      remove.textContent="Delete";
      remove.onclick=()=>deleteClass(item.id);
      controls.append(edit,remove);
      row.append(info,controls);
      list.append(row);
    }
  }

  function showForm(item){
    const form=$("classForm");
    form.reset();
    $("classOriginalId").value=item?item.id:"";
    form.elements.namedItem("type").value=item?item.type:"Breakout Class";
    form.elements.namedItem("day").value=item?item.day:DAYS[0];
    form.elements.namedItem("course").value=item?item.course:"";
    form.elements.namedItem("courseCode").value=item?item.courseCode:"";
    form.elements.namedItem("teacherName").value=item?(item.teacherName||(item.teacherCode==="Br"?"Bruh":item.teacherCode?"Dr. "+({S:"Sintayehu",B:"Bereket",N:"Nebiyu",D:"Demisse",T:"Tekalign",Z:"Zebene"})[item.teacherCode]||item.teacherCode:"")):"";
    form.elements.namedItem("group").value=item?item.group:"";
    form.elements.namedItem("room").value=item?item.room:"";
    form.elements.namedItem("startTime").value=item?timeValue(item.startTime):"";
    form.elements.namedItem("endTime").value=item?timeValue(item.endTime):"";
    form.elements.namedItem("timeSuffix").value=item?item.timeSuffix:"";
    $("editorTitle").textContent=item?"Edit class":"Add class";
    $("editorError").textContent="";
    $("classListView").classList.add("hidden");
    form.classList.remove("hidden");
  }

  function newId(classes){
    let id;
    do{id="class-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)}
    while(classes.some(item=>item.id===id));
    return id;
  }

  function saveClass(event){
    event.preventDefault();
    const form=$("classForm");
    const values=new FormData(form);
    const classes=window.scheduleEditorAPI.getClasses();
    const originalId=String(values.get("originalId")||"");
    const id=originalId||newId(classes);
    const candidate={
      id,
      day:String(values.get("day")),
      course:String(values.get("course")).trim(),
      courseCode:String(values.get("courseCode")).trim(),
      type:String(values.get("type")),
      teacherCode:"",
      teacherName:String(values.get("teacherName")||"").trim(),
      group:String(values.get("group")||"").trim(),
      room:String(values.get("room")||"").trim(),
      startTime:String(values.get("startTime")),
      endTime:String(values.get("endTime")),
      timeSuffix:String(values.get("timeSuffix")||"").trim()
    };
    try{
      if(originalId){
        const index=classes.findIndex(item=>item.id===originalId);
        if(index<0)throw Error("This class no longer exists. Refresh the schedule and try again.");
        classes[index]=candidate;
      }else classes.push(candidate);
      window.scheduleEditorAPI.commitClasses(classes);
      window.scheduleEditorAPI.toast("Class saved.");
      showList();
    }catch(error){
      $("editorError").textContent=error.message;
    }
  }

  function deleteClass(id){
    const item=window.scheduleEditorAPI.getClasses().find(entry=>entry.id===id);
    if(!item||!window.confirm('Delete "'+item.course+'" from the timetable?'))return;
    try{
      window.scheduleEditorAPI.commitClasses(window.scheduleEditorAPI.getClasses().filter(entry=>entry.id!==id));
      window.scheduleEditorAPI.toast("Class deleted.");
      renderList();
    }catch(error){
      window.scheduleEditorAPI.toast("Could not delete class. "+error.message);
    }
  }

  function init(){
    $("manageBtn").onclick=()=>{
      showList();
      $("scheduleEditor").showModal();
    };
    $("closeEditor").onclick=()=>$("scheduleEditor").close();
    $("addClassBtn").onclick=()=>showForm(null);
    $("cancelEditBtn").onclick=showList;
    $("classForm").addEventListener("submit",saveClass);
    $("scheduleEditor").addEventListener("click",event=>{
      if(event.target===$("scheduleEditor"))$("scheduleEditor").close();
    });
  }

  document.addEventListener("DOMContentLoaded",init);
})();
