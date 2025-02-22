var itemsapiurl = "https://fa-etao-dev22-saasfademo1.ds-fa.oraclepdemos.com:443/fscmRestApi/resources/11.13.18.05/itemsV2";
var changesapiurl = "https://fa-etao-dev22-saasfademo1.ds-fa.oraclepdemos.com:443/fscmRestApi/resources/11.13.18.05/productChangeOrdersV2";

var auth64="";
var avinit=0;
var avurl = "http://localhost:8888";
var treesource = [];
var fetchcount=0;
var downloadlist=[];

//localStorage.clear();
//localStorage.removeItem("un");
//john.dunbar, K#5K#t5M

function store_config() {
    if (document.getElementById('un').value != undefined && document.getElementById('un').value != "")
        localStorage.setItem("un", document.getElementById('un').value);
    if (document.getElementById('pw').value != undefined && document.getElementById('pw').value != "")
        localStorage.setItem("pw", document.getElementById('pw').value);
    let def = document.getElementById("defaultchangetype").value;
    localStorage.setItem("defaultchangetype", def);
}

function load_config(){
    if (localStorage.getItem("defaultchangetype") != undefined)
        document.getElementById("defaultchangetype").value = localStorage.getItem("defaultchangetype");
    if (localStorage.getItem("un") != undefined)
        document.getElementById('un').value = localStorage.getItem("un");
    if (localStorage.getItem("pw") != undefined)
        document.getElementById('pw').value = localStorage.getItem("pw");
}

function changedefaultchangetype(ev) {
    let val = ev.target.selectedOptions[0].label;
    var treeItems = $("#jqxTree").jqxTree('getItems');
    var firstItem = treeItems[0];
    $('#jqxTree').jqxTree('updateItem', firstItem, { 'label': val, 'id': 'treetop' });
}

function encauth(){
    var un = document.getElementById('un').value;
    var pw = document.getElementById('pw').value;
    auth64 = btoa(un + ":" + pw);

}

function checkcreds(){
    let pw=document.getElementById('pw').value;
    let un=document.getElementById('un').value;
    if (un==undefined || pw==undefined || un=="" || pw=="") {
        var creds = document.getElementById('creds');
        creds.setAttribute('open', 'true');
       // alert('You must enter Your Fusion Cloud credentials before You begin');
        return false;
    }
    encauth();
    return true;
}

//ARCO-COM-00021

$(document).ready(function () {

    load_config();
    checkcreds();

    let options = document.getElementById('defaultchangetype').selectedOptions;
    let lab = options[0].label;
    let firstel = { 'label': lab, 'id': 'treetop' };
    treesource.push(firstel);

    $('#jqxExpander').jqxExpander({ showArrow: false, toggleMode: 'none', width: '600px', height: '450px' });
    $('#jqxTree').jqxTree({ source: treesource, width: '100%', height: '100%', checkboxes: false });
    $('#jqxTree').jqxTree('selectItem', null);
    $('#jqxTree').on('itemClick',treeclick);

    $("#ldr").jqxLoader({ width: 100, height: 60, imagePosition: 'top' });

    const urlParams = new URLSearchParams(window.location.search);
    const par = urlParams.get('change');
    if(urlParams.has('change')){
       document.getElementById('srch').value = par;
       search();
    }

    window.addEventListener('message',function(event){
        window.opener.contentWindow.postMessage('echo','*');
    });

    exp();
});

function treeclick(event){
    var args = event.args;
    var item = $('#jqxTree').jqxTree('getItem', args.element);
    var val = item.value; //filename|itemnumber|itemrev
    var vals=val.split("|");
    //alert(vals[0]);
    if(vals[0].endsWith(".pdf"))
      callAV("setFile",vals[0]);
    else
      callAV("openMarkup",vals[0]);
}

async function dofire(ev){
    var sel=window.getSelection();
    var text=sel.toString();
    alert(text);
   //const text = await navigator.clipboard.readText();
   document.getElementById('srch').value = text;
   search();
}

function cleartree(){
    let titems = $('#jqxTree').jqxTree('getItems');
    let item1 = titems[0];
    $('#jqxTree').jqxTree('clear');
    $('#jqxTree').jqxTree('addTo', item1);
}

// to get item description:
//https://fa-etao-dev22-saasfademo1.ds-fa.oraclepdemos.com:443/fscmRestApi/resources/11.13.18.05/productChangeOrdersV2/{}/child/changeOrderAffectedObject/{}/child/changeOrderAffectedItem
//OR  ?q=ItemNumber=900024&fields=ItemNumber,ItemDescription,ItemClass&links=self&totalResults=true

/*
async function fetchdata(urls){
  try {
    const promises = urls.map(url => fetch(url).then(response => response.json()));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
*/

function makechangelabel(id,changenumber,changedescription){
  let citem = { id: id,icon: "/icons/cubes-solid.svg", label: "<span style='color:maroon;font-weight:bold;'>" + changenumber + "</span>&nbsp;-&nbsp;&nbsp;" +    changedescription, expanded: false};
  return citem;
}

function makepartlabel(id,itemnumber,itemrev,itemdescription){
   let aitem = { id:id, icon: "/icons/prescription-bottle-solid.svg", label: "<span style='color:maroon;font-weight:bold;'>" + itemnumber + " (" + itemrev + ")</span>&nbsp;&nbsp;&nbsp;" + itemdescription, expanded: false};
   return aitem;
}

function makedoclabel(id,filename,filedescription,itemnumber,itemrev){
  let doci = filename.endsWith(".pdf") ? "fa-file-pdf" : "fa-file";
  let filename2=filename.endsWith(".pdf") ? "<span style='color:blue'>"+filename+'</span>' : filename;
  let docitem = { id: id,label: "<i class='fa-solid " + doci + "'></i>&nbsp;&nbsp;" + filename2 + "&nbsp;&nbsp;&nbsp;&nbsp;" + filedescription, value: filename+"|"+itemnumber+"|"+itemrev };
  return docitem;
}

/*
function makedoclabel(id,filename,filedescription,itemnumber,itemrev){
  let doci = filename.endsWith(".pdf") ? "fa-file-pdf" : "fa-file";
  let filename2=filename.endsWith(".pdf") ? "<span style='color:blue'>"+filename+'</span>' : filename;
  let docitem = { id: id,label: "<input id='cb"+id+"' type='checkbox'>&nbsp;&nbsp;<i class='fa-solid " + doci + "'></i>&nbsp;&nbsp;" + filename2 + "&nbsp;&nbsp;&nbsp;&nbsp;" + filedescription, value: filename+","+itemnumber+","+itemrev };
  return docitem;
}
*/

function addsibling(previd, jsonitem) {
    $('#jqxTree').jqxTree('addAfter', jsonitem, $('#' + previd));
}

function addchild(previd, jsonitem) {
    $('#jqxTree').jqxTree('addTo', jsonitem, $('#' + previd));
}

function addtotreetop(jsonitem) {
    $('#jqxTree').jqxTree('addAfter', jsonitem, $('#treetop'));
}

function objfilter(item){
    let mode=item.ChangeNotice!=undefined ? "Change" : "Part";
    let sval = $('#srch').val();
    let seltype = $('#seltype').val();
    let selop = $('#selop').val();
    let number=(mode=="Part") ? item.ItemNumber : item.ChangeNotice;
    if(sval!="*" && sval.length > 0){
            if (seltype == mode && selop == "equals" && number != sval)
                return false;
            if (seltype == mode && selop == "startswith" && !number.startsWith(sval))
                return false;
            if (seltype == mode && selop == "endswith" && !number.endsWith(sval))
                return false;
            if (seltype == mode && selop == "contains" && number.indexOf(sval) < 0)
               return false;
    }
    return true;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function maketreeid(){
  let id="";
  for (let i = 0; i < arguments.length; i++) {
       id=id+arguments[i];
       if(i<(arguments.length-1))
         id=id+"-";
  }

  return hashCode(id);
}

function partnextphase(items,changenumber,changedescription,itemnumber,itemrev){
     let firstid="";
     let pdfs=[];
     let markups=[];
     
     for(let i=0;i<items.length;i++){
         let item=items[i];
         //item.DmDocumentId;//can be null!!! 900020 has sample1.pdf with null DmDocumentId
         let finfo=[item.FileName,item.Description];  
         if(finfo[0].endsWith(".pdf"))
           pdfs.push(finfo);
         else
           markups.push(finfo);
     }
   
     let lastid="";
     for(let i=0;i<pdfs.length;i++){
         let filename=pdfs[i][0];
         let filedescription=pdfs[i][1];
         let doctreeid=maketreeid(changenumber,itemnumber,filename);
         downloadlist.push(itemnumber+":"+itemrev+":"+filename+":"+doctreeid);
         let doci=makedoclabel(doctreeid,filename,filedescription,itemnumber,itemrev);
         lastid=doctreeid;
         if(i==0){
           firstid=doctreeid;
           addchild(maketreeid(changenumber,itemnumber),doci);
         }else
           addsibling(firstid,doci);
     }

     for(let i=0;i<markups.length;i++){
         let filename=markups[i][0];
         let filedescription=markups[i][1];
         let doctreeid=maketreeid(changenumber,itemnumber,filename);
         downloadlist.push(itemnumber+":"+itemrev+":"+filename+":"+doctreeid);
         let doci=makedoclabel(doctreeid,filename,filedescription,itemnumber,itemrev);
         if(i==0 && firstid=="")
           addchild(maketreeid(changenumber,itemnumber),doci);
         else
           addsibling(lastid,doci);
     }

     fetchcount--;
     if(fetchcount<1){
       $('#ldr').jqxLoader('close'); 
       let titemcnt=$('#jqxTree').jqxTree('getItems').length; 
       if(titemcnt<15)
         exp();
     }     
}

function processDocs(url,changenumber,changedescription,itemnumber,itemrev){

        fetch(url, { method: "GET", headers: { "Authorization": "Basic " + auth64 } })
            .then(response => {
                if (!response.ok)
                    throw new Error('http error: ' + response.status);
                return response.json();
            })
            .then(data => {
                let items = data.items;
                if (items.length > 0)                 
                   partnextphase(items,changenumber,changedescription,itemnumber,itemrev);// 'asynchronous'
            })
            .catch(error => {
                console.error("error: " + error);
                alert("error: " + error);
            });                
   
}

function getAOAttachUrl(item){
  let links = item.links;
  for (let k = 0; k < links.length; k++) {
      let link = links[k];
      if (link.name == 'changeOrderAffectedItemAttachment') {
         let href = link.href;
         let url = href + "?fields=FileName,DmDocumentId,Description&onlyData=true";
         return url;
      }
  } 
  return "";  
}

function changenextphase(items){
     let mods=0;
     let matchingchgs=items.filter(objfilter);
     matchingchgs.forEach(function(item){
         let changenumber=item.ChangeNotice;
         let changedescription=item.Description;
         let aos=item.changeOrderAffectedObject;
         let matchingparts=aos.filter(objfilter); 
         if(matchingparts.length>0){ 
            console.log(changenumber);
            let cel=makechangelabel(changenumber,changenumber,changedescription);
            addtotreetop(cel);
         }
         var firstid="";
         for(i=0;i<matchingparts.length;i++){
             let item=matchingparts[i];
             let itemnumber=item.ItemNumber;
             let itemrev=item.NewItemRevision;
             let href=getAOAttachUrl(item);
             if(href.length>0){
               mods++;
               fetchcount++;
               let partid=maketreeid(changenumber,itemnumber);
               let part=makepartlabel(partid,itemnumber,itemrev,"");
               if(i==0){
                   firstid=partid;
                   addchild(changenumber,part); 
               }else
                   addsibling(partid,part);                
               processDocs(href,changenumber,changedescription,itemnumber,itemrev);//all you need to update 3 levels of the tree
               console.log("spawned off "+item.ItemNumber);
             }
         }
     });
     if(mods<1){
       $('#ldr').jqxLoader('close');
       alert('No matching objects found');
     }       
}

function getAllPendingChangesAndAffectedItems(){
    let defchangeselval=document.getElementById("defaultchangetype").value;
    let defchangetype = defchangeselval=="*" ? "ChangeTypeValue!=99bog9" : "ChangeTypeValue=" + defchangeselval;
    let url = changesapiurl + "?q=" + defchangetype + ";ImplementationDateTime is null&expand=changeOrderAffectedObject&links=child&totalResults=true";

    if(!checkcreds())
       return;

    $('#ldr').jqxLoader('open');

    fetch(url, { method: "GET", headers: { "Authorization": "Basic " + auth64 } })
            .then(response => {
                if (!response.ok)
                    throw new Error('http error: ' + response.status);
                return response.json();
            })
            .then(data => {
                let items = data.items;
                if (items.length > 0) {
                    let totalresults = data.totalResults;
                    let count = data.count;
                    hasmore = data.hasMore;
                    let limit = data.limit;
                    let offset = data.offset;
                    downloadlist=[];
                    cleartree();
                    changenextphase(items);// 'asynchronous'
                }else{
                   $('#ldr').jqxLoader('close');
                   alert('no data found');
                }
            })
            .catch(error => {
                console.error("error: " + error);
                alert("error: " + error);
            });
}


//1. 
//get all unreleased changes and affected item numbers and revs
//?q=ChangeTypeValue=ARCO_Commercial_Release_Cork;ImplementationDateTime is null&expand=changeOrderAffectedObject&links=child&totalResults=true
// items[{ChangeNotice,Description,ChangeName,StatusCodeValue,ChangeTypeNameValue,
//    changeOrderAffectedObject[{NewItemRevision,ItemNumber}]}

//2.
// get uniqueitemnumber   ?q=ItemNumber=900024&fields=ItemNumber,ItemDescription,ItemClass&links=self&totalResults=true
//     items[{ItemNumber,ItemDescription,ItemClass},links[0].href

//3.
//get download links
// href/child/ItemRevision?q=RevisionCode=B&expand=RevisionAttachment&links=enclosure

// if you start with item number
//1. get all unreleased changes and affected item numbers and revs
//?q=ChangeTypeValue=ARCO_Commercial_Release_Cork;ImplementationDateTime is null&expand=changeOrderAffectedObject&links=child&totalResults=true
// items[{ChangeNotice,Description,ChangeName,StatusCodeValue,ChangeTypeNameValue,
//    changeOrderAffectedObject[{NewItemRevision,ItemNumber}]}
// pick out change number and item rev by searching through and matching changeOrderAffectedObjects
//2.  get uniqueitemnumber   ?q=ItemNumber=900024&fields=ItemNumber,ItemDescription,ItemClass&links=self&totalResults=true
//     items[{ItemNumber,ItemDescription,ItemClass},links[0].href
//3.  get Rev and Download links for all pending Revs
//   itemsapiurl/item_unique_id/child/ItemRevision?q=ImplementationDate is null&expand=RevisionAttachment&links=enclosure   

var expstate = true;

function exp() {
    $('#jqxTree').jqxTree('expandAll');
}

function coll() {
    $('#jqxTree').jqxTree('collapseAll');
}

function chk() {
    alert(document.getElementById('c1').checked);
}

function togexp() {
    if (expstate) {
        expstate = false;
        coll();
    } else {
        expstate = true;
        exp();
    }
}

function markup() {
  if(1>0)
    return;
  let markuploadlist=[];
  let pdffile="";
  for(let i=0;i<downloadlist.length;i++){
     let dlval=downloadlist[i];//itemnumber:itemrev:filename:id
     let dlvals=dlval.split(":");
     let cb=document.getElementById('cb'+dlvals[3]);
     if(cb.checked){
       if(dlvals[2].endsWith(".pdf"))
         pdffile=dlvals[2];
       else
         markuploadlist.push(dlvals[2]);
     }
  }
  if(pdffile.length<1 && markuploadlist.length<1)
    return;

  if(pdffile.length>0){
    console.log("loading pdf file "+pdffile+" into AutoVue");
    callAV("setFile",pdffile);
  }
  for(let i=0;i<markuploadlist.length;i++){
       let filename=markuploadlist[i];
       console.log("loading markup file "+filename+" into AutoVue");
       callAV("openMarkup",filename);  
  }
}

function getmarkups() {
    //alert("Get Markups");
    avinit=0;
}

function search() {
    let cb = document.getElementById("cloudcb").checked;
    let srch = document.getElementById("srch").value;
    if (!cb && (srch == "" || srch == undefined))
        return;
    //alert("search for: "+srch+"("+cb+")");
    if (cb) {
        getAllPendingChangesAndAffectedItems();
    }
}

//cmd: setFile,openMarkup,closeDocument,invokeAction

function closeavwin(){
   callAV('closeDocument',"");
}

function avexit(){
   callAV('invokeAction',"VueActionFileExit");
}

function callAV(method,filename){
    let params=[];

    if(avinit>0){
      if(method=="setFile"){
        if(filename.length>0)
          params=["upload://C:\\Users\\spf\\Downloads\\"+filename,null];
        else
          params=["",null]; 
      }else if(method=='openMarkup')
        params=["CSI_DocName="+filename,null];
      else if(method=='closeDocument')
        params=[null];
      else if(method=='invokeAction')
        params=[filename,null]; //other commands???
    }

    let cmd="";
    
    if(avinit==0)
        cmd={"jsonrpc":"2.0","id":0,"method":"init", "params": [null]};
   // else if(avinit==1)
     //   cmd={"jsonrpc":"2.0","id":0,"method":"setFile", "params": ["",null]};
    else
        cmd={"jsonrpc":"2.0","id":0,"method":method, "params": params};

    fetch(avurl,{method:"POST",body: JSON.stringify(cmd)})
            .then(response => {
                if (!response.ok)
                    throw new Error('http error: ' + response.status);
                return response.json();
            })
            .then(json => {
                console.log("avinit="+avinit);
                console.log("("+JSON.stringify(cmd)+") "+" av response="+JSON.stringify(json));
                if(avinit==0){
                   avinit=1;
                   setTimeout(function(){callAV(method,filename);},1000);
                }else if(avinit==1){
                   avinit=2;
                   //setTimeout(function(){callAV(method,filename);},1100);
                }
            })
            .catch(error => {
              console.error("error: "+error);
              alert("error: "+error);
            });
}
