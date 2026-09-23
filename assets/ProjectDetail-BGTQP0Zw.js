import{r as c,A as S,j as e}from"./index-BK8z3HAu.js";const E=[{value:"lease",label:"Original Lease"},{value:"amendment",label:"Amendment"},{value:"title_report",label:"Title Report"},{value:"other",label:"Other"}],z={lease:"Original Lease",amendment:"Amendment",title_report:"Title Report",other:"Other"},_={high:{bg:"#fef2f2",color:"#dc2626",border:"#fecaca"},medium:{bg:"#fffbeb",color:"#d97706",border:"#fde68a"},low:{bg:"#f0fdf4",color:"#16a34a",border:"#bbf7d0"}};function k(i){return i?new Date(i).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"-"}function $({status:i}){const f={completed:{label:"Completed",color:"#16a34a",bg:"#f0fdf4"},processing:{label:"Processing",color:"#d97706",bg:"#fffbeb"},text_extracted:{label:"Extracted",color:"#2563eb",bg:"#eff6ff"},extraction_failed:{label:"Failed",color:"#dc2626",bg:"#fef2f2"},text_extraction_empty:{label:"Empty",color:"#6b7280",bg:"#f9fafb"},uploaded:{label:"Uploaded",color:"#6b7280",bg:"#f9fafb"}}[i]||{label:i,color:"#6b7280",bg:"#f9fafb"};return e.jsx("span",{style:{fontSize:"11px",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",padding:"2px 8px",borderRadius:"3px",background:f.bg,color:f.color},children:f.label})}function O({significance:i}){const h=(i||"").toLowerCase(),f=_[h]||_.low;return e.jsx("span",{style:{fontSize:"11px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",padding:"2px 8px",borderRadius:"3px",background:f.bg,color:f.color,border:`1px solid ${f.border}`},children:i})}function W({projectId:i,onClose:h,onSuccess:f}){const[o,p]=c.useState(null),[d,g]=c.useState("lease"),[r,l]=c.useState(""),[t,m]=c.useState(!1),[x,n]=c.useState(!1),[j,s]=c.useState(null),[w,v]=c.useState(!1),b=c.useRef(null),y=a=>{const u=a.name.slice(a.name.lastIndexOf(".")).toLowerCase();if(![".pdf",".docx"].includes(u)){s("Only PDF and DOCX files are supported.");return}s(null),p(a)},N=a=>{a.preventDefault(),v(!1);const u=a.dataTransfer.files[0];u&&y(u)},C=async()=>{if(o){n(!0),s(null);try{const a=new FormData;a.append("file",o),a.append("document_type",d),r&&a.append("effective_date",r),a.append("use_ocr",t?"true":"false");const u=await fetch(`${S}/api/projects/${i}/documents`,{method:"POST",body:a,credentials:"include"});if(!u.ok){const D=await u.json().catch(()=>({}));throw new Error(D.detail||`Upload failed (${u.status})`)}const T=await u.json();f(T)}catch(a){s(a.message)}finally{n(!1)}}};return e.jsx("div",{className:"project-detail-overlay",onClick:a=>a.target===a.currentTarget&&h(),children:e.jsxs("div",{className:"project-detail-modal",children:[e.jsxs("div",{className:"project-detail-modal-header",children:[e.jsx("h3",{style:{margin:0,fontSize:"16px",fontWeight:700,color:"var(--fs-blue)"},children:"Add Document"}),e.jsx("button",{className:"project-detail-icon-btn",onClick:h,"aria-label":"Close",children:"✕"})]}),e.jsxs("div",{style:{padding:"var(--fs-space-2)",display:"flex",flexDirection:"column",gap:"var(--fs-space-2)"},children:[e.jsxs("div",{className:`project-detail-dropzone${w?" drag-over":""}`,onClick:()=>{var a;return!x&&((a=b.current)==null?void 0:a.click())},onDrop:N,onDragOver:a=>{a.preventDefault(),v(!0)},onDragLeave:()=>v(!1),role:"button",tabIndex:0,onKeyDown:a=>{var u;(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),x||(u=b.current)==null||u.click())},children:[e.jsx("input",{ref:b,type:"file",accept:".pdf,.docx",style:{display:"none"},onChange:a=>{const u=a.target.files[0];u&&y(u)},disabled:x}),o?e.jsxs("div",{children:[e.jsx("strong",{style:{color:"var(--fs-blue)"},children:o.name}),e.jsxs("div",{style:{fontSize:"12px",color:"var(--fs-text-muted)",marginTop:"4px"},children:[(o.size/1024).toFixed(1)," KB"]})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{fontSize:"24px",marginBottom:"8px",opacity:.4},children:"⬆"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"var(--fs-blue)"},children:"Drop file here or click to browse"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:"12px",color:"var(--fs-text-muted)"},children:"PDF and DOCX supported"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"project-detail-label",children:"Document Type"}),e.jsx("select",{className:"project-detail-select",value:d,onChange:a=>g(a.target.value),disabled:x,children:E.map(a=>e.jsx("option",{value:a.value,children:a.label},a.value))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"project-detail-label",children:"Effective Date"}),e.jsx("input",{type:"date",className:"project-detail-input",value:r,onChange:a=>l(a.target.value),disabled:x})]}),e.jsxs("label",{className:"project-detail-ocr-toggle",children:[e.jsx("input",{type:"checkbox",checked:t,onChange:a=>m(a.target.checked),disabled:x}),e.jsx("span",{children:"Use OCR processing (for scanned documents)"})]}),t&&e.jsx("div",{className:"project-detail-ocr-warning",children:"⚠️ OCR processing takes 2 to 5 minutes longer but is required for scanned documents."}),j&&e.jsx("div",{className:"project-detail-error",children:j}),e.jsxs("div",{style:{display:"flex",gap:"var(--fs-space-1)",justifyContent:"flex-end"},children:[e.jsx("button",{className:"btn btn-secondary",onClick:h,disabled:x,children:"Cancel"}),e.jsx("button",{className:"btn btn-primary",onClick:C,disabled:!o||x,children:x?"Uploading…":"Upload"})]})]})]})})}function B({project:i,onProjectChange:h}){const[f,o]=c.useState(!1),p=i.documents||[],d=r=>{o(!1),h({...i,documents:[...p,r]})},g=r=>{window.open(`${S}/api/projects/${i.id}/documents/${r.id}/pdf`,"_blank")};return e.jsxs("div",{className:"project-detail-tab-content",children:[e.jsxs("div",{className:"project-detail-section-header",children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"12px",color:"var(--fs-text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:"4px"},children:"Documents"}),e.jsxs("div",{style:{fontSize:"14px",color:"var(--fs-text-muted)"},children:[p.length," document",p.length!==1?"s":""," in this project"]})]}),e.jsx("button",{className:"btn btn-primary",onClick:()=>o(!0),children:"+ Add Document"})]}),p.length===0?e.jsxs("div",{className:"project-detail-empty",children:[e.jsx("div",{style:{fontSize:"32px",opacity:.2,marginBottom:"12px"},children:"📄"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"var(--fs-blue)"},children:"No documents yet"}),e.jsx("p",{style:{margin:"6px 0 0",fontSize:"13px",color:"var(--fs-text-muted)"},children:"Upload the original lease to get started."})]}):e.jsx("div",{className:"project-detail-doc-list",children:p.map(r=>e.jsxs("div",{className:"project-detail-doc-card",children:[e.jsx("div",{className:"project-detail-doc-icon",children:r.file_type==="pdf"?"📄":"📝"}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"},children:[e.jsx("span",{style:{fontWeight:700,color:"var(--fs-blue)",fontSize:"14px"},children:r.file_name}),e.jsx("span",{className:"project-detail-doc-type-badge",children:z[r.document_type]||r.document_type}),e.jsx($,{status:r.status})]}),e.jsxs("div",{style:{display:"flex",gap:"16px",marginTop:"4px",fontSize:"12px",color:"var(--fs-text-muted)"},children:[r.effective_date&&e.jsxs("span",{children:["Effective: ",k(r.effective_date)]}),e.jsxs("span",{children:["Uploaded: ",k(r.uploaded_at)]}),r.terms&&e.jsxs("span",{children:[r.terms.length," term",r.terms.length!==1?"s":""," extracted"]})]})]}),e.jsx("div",{style:{display:"flex",gap:"8px",flexShrink:0},children:e.jsx("button",{className:"btn btn-secondary",style:{fontSize:"12px",padding:"6px 12px"},onClick:()=>g(r),title:"Download original file",children:"⬇ PDF"})})]},r.id))}),f&&e.jsx(W,{projectId:i.id,onClose:()=>o(!1),onSuccess:d})]})}function A({project:i}){const[h,f]=c.useState(null),[o,p]=c.useState(!1),[d,g]=c.useState(!1),[r,l]=c.useState(null),t=c.useCallback(async()=>{p(!0),l(null);try{const n=await fetch(`${S}/api/projects/${i.id}/comparison`,{credentials:"include"});if(n.status===404)f(null);else if(n.ok){const j=await n.json();f(j)}else throw new Error(`Failed to load comparison (${n.status})`)}catch(n){l(n.message)}finally{p(!1)}},[i.id]);c.useEffect(()=>{t()},[t]);const m=async()=>{g(!0),l(null);try{const n=await fetch(`${S}/api/projects/${i.id}/compare`,{method:"POST",credentials:"include"});if(!n.ok){const s=await n.json().catch(()=>({}));throw new Error(s.detail||`Comparison failed (${n.status})`)}const j=await n.json();f(j)}catch(n){l(n.message)}finally{g(!1)}},x=(h==null?void 0:h.timeline)||[];return e.jsxs("div",{className:"project-detail-tab-content",children:[e.jsxs("div",{className:"project-detail-section-header",children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"12px",color:"var(--fs-text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:"4px"},children:"Timeline & Changes"}),e.jsx("div",{style:{fontSize:"14px",color:"var(--fs-text-muted)"},children:"Chronological comparison of all document versions"})]}),e.jsx("button",{className:"btn btn-primary",onClick:m,disabled:d||(i.documents||[]).length===0,children:d?"Running…":"Run Comparison"})]}),r&&e.jsx("div",{className:"project-detail-error",children:r}),o?e.jsxs("div",{className:"project-detail-loading",children:[e.jsx("div",{className:"spinner"}),e.jsx("span",{children:"Loading comparison…"})]}):x.length===0?e.jsxs("div",{className:"project-detail-empty",children:[e.jsx("div",{style:{fontSize:"32px",opacity:.2,marginBottom:"12px"},children:"🔀"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"var(--fs-blue)"},children:"No comparison yet"}),e.jsx("p",{style:{margin:"6px 0 0",fontSize:"13px",color:"var(--fs-text-muted)"},children:'Click "Run Comparison" to generate a chronological change report.'})]}):e.jsx("div",{className:"project-detail-timeline",children:x.map((n,j)=>e.jsxs("div",{className:"project-detail-timeline-entry",children:[e.jsxs("div",{className:"project-detail-timeline-marker",children:[e.jsx("div",{className:"project-detail-timeline-dot"}),j<x.length-1&&e.jsx("div",{className:"project-detail-timeline-line"})]}),e.jsxs("div",{className:"project-detail-timeline-body",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"8px"},children:[e.jsx("span",{style:{fontWeight:700,color:"var(--fs-blue)",fontSize:"15px"},children:n.doc_name}),e.jsx("span",{className:"project-detail-doc-type-badge",children:z[n.document_type]||n.document_type}),n.effective_date&&e.jsx("span",{style:{fontSize:"12px",color:"var(--fs-text-muted)"},children:k(n.effective_date)}),j===0&&e.jsx("span",{style:{fontSize:"11px",fontWeight:600,color:"var(--fs-text-muted)",textTransform:"uppercase",letterSpacing:"0.06em"},children:"Baseline"})]}),n.changes_from_previous&&n.changes_from_previous.length>0?e.jsx("div",{className:"project-detail-changes",children:n.changes_from_previous.map((s,w)=>e.jsxs("div",{className:"project-detail-change-row",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"},children:[e.jsx("span",{style:{fontWeight:600,fontSize:"13px",color:"var(--fs-blue)"},children:s.field}),e.jsx(O,{significance:s.significance})]}),e.jsxs("div",{className:"project-detail-change-values",children:[e.jsxs("div",{className:"project-detail-change-old",children:[e.jsx("span",{className:"project-detail-change-label",children:"Before"}),e.jsx("span",{children:s.old_value??e.jsx("em",{style:{opacity:.5},children:"not present"})})]}),e.jsx("div",{className:"project-detail-change-arrow",children:"→"}),e.jsxs("div",{className:"project-detail-change-new",children:[e.jsx("span",{className:"project-detail-change-label",children:"After"}),e.jsx("span",{children:s.new_value??e.jsx("em",{style:{opacity:.5},children:"removed"})})]})]})]},w))}):j>0?e.jsx("div",{style:{fontSize:"13px",color:"var(--fs-text-muted)",fontStyle:"italic"},children:"No material changes detected from previous document."}):null]})]},n.doc_id))})]})}function I({project:i}){const[h,f]=c.useState({}),o=i.documents||[],p=[];for(const l of o)if(l.terms)for(const t of l.terms)p.push({...t,_doc:l});const d={};for(const l of p){const t=l.field_name;d[t]||(d[t]=[]),d[t].push(l)}const g=Object.keys(d).sort(),r=async(l,t)=>{const m=`${l._doc.id}-${l.id}`;f(x=>({...x,[m]:t}));try{await fetch(`${S}/api/projects/${i.id}/documents/${l._doc.id}/terms/${l.id}/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({feedback:t})})}catch{}};return p.length===0?e.jsx("div",{className:"project-detail-tab-content",children:e.jsxs("div",{className:"project-detail-empty",children:[e.jsx("div",{style:{fontSize:"32px",opacity:.2,marginBottom:"12px"},children:"📋"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"var(--fs-blue)"},children:"No terms extracted yet"}),e.jsx("p",{style:{margin:"6px 0 0",fontSize:"13px",color:"var(--fs-text-muted)"},children:"Upload a lease document to extract and review terms."})]})}):e.jsxs("div",{className:"project-detail-tab-content",children:[e.jsx("div",{className:"project-detail-section-header",children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"12px",color:"var(--fs-text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:"4px"},children:"Combined Terms"}),e.jsxs("div",{style:{fontSize:"14px",color:"var(--fs-text-muted)"},children:[p.length," terms across ",o.filter(l=>{var t;return(t=l.terms)==null?void 0:t.length}).length," document",o.filter(l=>{var t;return(t=l.terms)==null?void 0:t.length}).length!==1?"s":""]})]})}),e.jsx("div",{className:"project-detail-terms-list",children:g.map(l=>e.jsxs("div",{className:"project-detail-term-group",children:[e.jsx("div",{className:"project-detail-term-category",children:l.replace(/_/g," ")}),d[l].map(t=>{const m=`${t._doc.id}-${t.id}`,x=h[m];return e.jsxs("div",{className:"project-detail-term-row",children:[e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontWeight:600,color:"var(--fs-blue)",fontSize:"14px",marginBottom:"4px"},children:t.value||e.jsx("em",{style:{opacity:.5},children:"Not specified"})}),e.jsxs("div",{style:{display:"flex",gap:"12px",fontSize:"12px",color:"var(--fs-text-muted)",flexWrap:"wrap"},children:[e.jsx("span",{style:{background:"var(--fs-gray)",padding:"1px 6px",borderRadius:"2px",fontWeight:600,color:"var(--fs-blue)",fontSize:"11px"},children:z[t._doc.document_type]||t._doc.document_type}),e.jsx("span",{children:t._doc.file_name}),t.source_excerpt&&e.jsxs("span",{style:{fontStyle:"italic"},children:['"',t.source_excerpt.slice(0,80),t.source_excerpt.length>80?"…":"",'"']})]})]}),e.jsxs("div",{style:{display:"flex",gap:"4px",flexShrink:0,alignItems:"center"},children:[e.jsx("button",{className:"project-detail-feedback-btn",style:{opacity:x==="thumbs_up"?1:.4},onClick:()=>r(t,"thumbs_up"),title:"Accurate",children:"👍"}),e.jsx("button",{className:"project-detail-feedback-btn",style:{opacity:x==="thumbs_down"?1:.4},onClick:()=>r(t,"thumbs_down"),title:"Inaccurate",children:"👎"})]})]},m)})]},l))})]})}function R({project:i}){const[h,f]=c.useState(null),[o,p]=c.useState([]),[d,g]=c.useState(""),[r,l]=c.useState(!1),[t,m]=c.useState(null),x=c.useRef(null);c.useEffect(()=>{var s;(s=x.current)==null||s.scrollIntoView({behavior:"smooth"})},[o]);const n=async()=>{const s=d.trim();if(!s||r)return;g(""),l(!0),m(null);const w={role:"user",content:s,id:Date.now(),created_at:new Date().toISOString()};p(v=>[...v,w]);try{const v={content:s,session_id:h||null,project_id:i.id},b=await fetch("/api/chat/send",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(v)});if(!b.ok){const N=await b.json().catch(()=>({}));throw new Error(N.detail||`Chat error (${b.status})`)}const y=await b.json();f(y.id),p(y.messages||[])}catch(v){m(v.message),p(b=>b.filter(y=>y!==w))}finally{l(!1)}},j=s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),n())};return e.jsxs("div",{className:"project-detail-chat-wrap",children:[e.jsxs("div",{className:"project-detail-chat-context",children:[e.jsx("span",{style:{fontSize:"11px",fontWeight:600,color:"var(--fs-text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"},children:"Context:"}),(i.documents||[]).filter(s=>s.status==="completed").map(s=>e.jsx("span",{className:"project-detail-doc-type-badge",style:{fontSize:"11px"},children:s.file_name},s.id)),(i.documents||[]).filter(s=>s.status==="completed").length===0&&e.jsx("span",{style:{fontSize:"12px",color:"var(--fs-text-muted)",fontStyle:"italic"},children:"No processed documents yet"})]}),e.jsxs("div",{className:"project-detail-chat-messages",children:[o.length===0&&e.jsxs("div",{className:"project-detail-chat-placeholder",children:[e.jsx("div",{style:{fontSize:"28px",opacity:.2,marginBottom:"10px"},children:"💬"}),e.jsx("p",{style:{margin:0,fontWeight:600,color:"var(--fs-blue)"},children:"Ask about this project"}),e.jsx("p",{style:{margin:"6px 0 0",fontSize:"13px",color:"var(--fs-text-muted)"},children:"Questions about lease terms, changes, obligations, and more."})]}),o.map(s=>e.jsxs("div",{className:`project-detail-chat-msg project-detail-chat-msg-${s.role}`,children:[e.jsx("div",{className:"project-detail-chat-msg-label",children:s.role==="user"?"You":"Assistant"}),e.jsx("div",{className:"project-detail-chat-msg-body",children:s.content})]},s.id)),r&&e.jsxs("div",{className:"project-detail-chat-msg project-detail-chat-msg-assistant",children:[e.jsx("div",{className:"project-detail-chat-msg-label",children:"Assistant"}),e.jsx("div",{className:"project-detail-chat-msg-body",style:{opacity:.5},children:e.jsx("div",{className:"spinner",style:{width:"14px",height:"14px",borderWidth:"2px"}})})]}),e.jsx("div",{ref:x})]}),t&&e.jsx("div",{className:"project-detail-error",style:{margin:"0 var(--fs-space-2)"},children:t}),e.jsxs("div",{className:"project-detail-chat-input-row",children:[e.jsx("textarea",{className:"project-detail-chat-input",value:d,onChange:s=>g(s.target.value),onKeyDown:j,placeholder:"Ask about the lease, terms, changes… (Enter to send)",rows:2,disabled:r}),e.jsx("button",{className:"btn btn-primary",style:{alignSelf:"flex-end",flexShrink:0},onClick:n,disabled:!d.trim()||r,children:"Send"})]})]})}const F=[{id:"documents",label:"Documents"},{id:"timeline",label:"Timeline & Changes"},{id:"terms",label:"Terms"},{id:"chat",label:"Chat"}];function L({project:i,user:h,onBack:f}){const[o,p]=c.useState(i),[d,g]=c.useState("documents"),[r,l]=c.useState(null);return c.useEffect(()=>{let t=!1;return fetch(`${S}/api/projects/${i.id}`,{credentials:"include"}).then(m=>{if(!m.ok)throw new Error(`Failed to load project (${m.status})`);return m.json()}).then(m=>{t||p(m)}).catch(m=>{t||l(m.message)}),()=>{t=!0}},[i.id]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .project-detail-header {
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-white);
          padding: var(--fs-space-2) var(--fs-space-3);
        }
        .project-detail-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: var(--fs-text-muted);
          padding: 0;
          margin-bottom: var(--fs-space-1);
          font-family: inherit;
        }
        .project-detail-back:hover { color: var(--fs-blue); }
        .project-detail-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--fs-blue);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .project-detail-meta {
          font-size: 13px;
          color: var(--fs-text-muted);
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .project-detail-tabs {
          display: flex;
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-white);
          padding: 0 var(--fs-space-3);
          overflow-x: auto;
        }
        .project-detail-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--fs-text-muted);
          padding: 12px 16px;
          white-space: nowrap;
          font-family: inherit;
          letter-spacing: 0.02em;
          transition: color 0.15s, border-color 0.15s;
        }
        .project-detail-tab:hover { color: var(--fs-blue); }
        .project-detail-tab.active {
          color: var(--fs-blue);
          border-bottom-color: var(--fs-neon);
        }
        .project-detail-tab-content {
          padding: var(--fs-space-3);
          max-width: 900px;
        }
        .project-detail-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--fs-space-2);
          margin-bottom: var(--fs-space-2);
          flex-wrap: wrap;
        }
        .project-detail-empty {
          text-align: center;
          padding: var(--fs-space-4);
          background: var(--fs-gray);
          border: 1px solid var(--fs-border);
        }
        .project-detail-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: var(--fs-space-3);
          color: var(--fs-text-muted);
          font-size: 14px;
        }
        .project-detail-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px var(--fs-space-1);
          font-size: 13px;
          border-radius: 2px;
          margin-bottom: var(--fs-space-1);
        }
        .project-detail-doc-list { display: flex; flex-direction: column; gap: var(--fs-space-1); }
        .project-detail-doc-card {
          display: flex;
          align-items: center;
          gap: var(--fs-space-1);
          padding: var(--fs-space-1) var(--fs-space-2);
          background: var(--fs-white);
          border: 1px solid var(--fs-border);
        }
        .project-detail-doc-card:hover { border-color: var(--fs-light-blue); }
        .project-detail-doc-icon { font-size: 22px; flex-shrink: 0; opacity: 0.7; }
        .project-detail-doc-type-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 2px 6px;
          background: rgba(0, 36, 58, 0.07);
          color: var(--fs-blue);
          border-radius: 2px;
        }
        .project-detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--fs-space-2);
        }
        .project-detail-modal {
          background: var(--fs-white);
          width: 100%;
          max-width: 480px;
          border: 1px solid var(--fs-border);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .project-detail-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--fs-space-1) var(--fs-space-2);
          border-bottom: 1px solid var(--fs-border);
        }
        .project-detail-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--fs-text-muted);
          padding: 4px 8px;
          border-radius: 2px;
          font-family: inherit;
        }
        .project-detail-icon-btn:hover { background: var(--fs-gray); color: var(--fs-blue); }
        .project-detail-dropzone {
          border: 2px dashed var(--fs-border);
          padding: var(--fs-space-3);
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .project-detail-dropzone:hover, .project-detail-dropzone.drag-over {
          border-color: var(--fs-neon);
          background: #fafff0;
        }
        .project-detail-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
          margin-bottom: 6px;
        }
        .project-detail-select, .project-detail-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--fs-border);
          font-size: 13px;
          font-family: inherit;
          color: var(--fs-blue);
          background: var(--fs-white);
          box-sizing: border-box;
          border-radius: 0;
        }
        .project-detail-select:focus, .project-detail-input:focus {
          outline: 2px solid var(--fs-neon);
          outline-offset: -2px;
        }
        .project-detail-ocr-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--fs-blue);
        }
        .project-detail-ocr-warning {
          font-size: 12px;
          color: #d97706;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 8px 10px;
          border-radius: 2px;
        }
        .project-detail-timeline { display: flex; flex-direction: column; gap: 0; }
        .project-detail-timeline-entry { display: flex; gap: var(--fs-space-2); }
        .project-detail-timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 20px;
        }
        .project-detail-timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--fs-neon);
          border: 2px solid var(--fs-blue);
          flex-shrink: 0;
          margin-top: 4px;
        }
        .project-detail-timeline-line {
          width: 2px;
          flex: 1;
          background: var(--fs-border);
          min-height: 20px;
          margin: 4px 0;
        }
        .project-detail-timeline-body { flex: 1; padding-bottom: var(--fs-space-2); padding-top: 0; }
        .project-detail-changes { display: flex; flex-direction: column; gap: 10px; }
        .project-detail-change-row {
          background: var(--fs-gray);
          border: 1px solid var(--fs-border);
          padding: 10px var(--fs-space-1);
        }
        .project-detail-change-values {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .project-detail-change-old, .project-detail-change-new {
          flex: 1;
          min-width: 120px;
          font-size: 13px;
          color: var(--fs-blue);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .project-detail-change-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
          margin-bottom: 2px;
        }
        .project-detail-change-old { opacity: 0.6; }
        .project-detail-change-arrow {
          font-size: 16px;
          color: var(--fs-text-muted);
          flex-shrink: 0;
          align-self: center;
          padding-top: 14px;
        }
        .project-detail-terms-list { display: flex; flex-direction: column; gap: var(--fs-space-2); }
        .project-detail-term-group { border: 1px solid var(--fs-border); }
        .project-detail-term-category {
          background: var(--fs-blue);
          color: var(--fs-white);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px var(--fs-space-1);
        }
        .project-detail-term-row {
          display: flex;
          align-items: center;
          gap: var(--fs-space-1);
          padding: 10px var(--fs-space-1);
          border-top: 1px solid var(--fs-border);
        }
        .project-detail-term-row:first-of-type { border-top: none; }
        .project-detail-feedback-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 6px;
          border-radius: 3px;
          transition: opacity 0.15s, background 0.15s;
        }
        .project-detail-feedback-btn:hover { background: var(--fs-gray); opacity: 1 !important; }
        .project-detail-chat-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 220px);
          min-height: 400px;
        }
        .project-detail-chat-context {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: var(--fs-space-1) var(--fs-space-2);
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-gray);
        }
        .project-detail-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--fs-space-2);
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-1);
        }
        .project-detail-chat-placeholder { text-align: center; margin: auto; padding: var(--fs-space-3); }
        .project-detail-chat-msg { max-width: 75%; display: flex; flex-direction: column; gap: 4px; }
        .project-detail-chat-msg-user { align-self: flex-end; }
        .project-detail-chat-msg-assistant { align-self: flex-start; }
        .project-detail-chat-msg-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
        }
        .project-detail-chat-msg-user .project-detail-chat-msg-label { text-align: right; }
        .project-detail-chat-msg-body {
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .project-detail-chat-msg-user .project-detail-chat-msg-body { background: var(--fs-blue); color: var(--fs-white); }
        .project-detail-chat-msg-assistant .project-detail-chat-msg-body {
          background: var(--fs-gray);
          color: var(--fs-blue);
          border: 1px solid var(--fs-border);
        }
        .project-detail-chat-input-row {
          display: flex;
          gap: var(--fs-space-1);
          padding: var(--fs-space-1) var(--fs-space-2);
          border-top: 1px solid var(--fs-border);
          background: var(--fs-white);
        }
        .project-detail-chat-input {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid var(--fs-border);
          font-size: 13px;
          font-family: inherit;
          color: var(--fs-blue);
          resize: none;
          border-radius: 0;
        }
        .project-detail-chat-input:focus { outline: 2px solid var(--fs-neon); outline-offset: -2px; }
      `}),e.jsxs("div",{className:"project-detail-header",children:[e.jsx("button",{className:"project-detail-back",onClick:f,children:"← Back to projects"}),e.jsx("h1",{className:"project-detail-title",children:o.name}),r&&e.jsxs("div",{style:{color:"#dc2626",fontSize:"12px",marginTop:"4px"},children:["⚠ Could not refresh project data: ",r]}),e.jsxs("div",{className:"project-detail-meta",children:[o.property_address&&e.jsx("span",{children:o.property_address}),o.description&&e.jsx("span",{children:o.description}),e.jsxs("span",{children:["Created ",k(o.created_at)]}),e.jsxs("span",{children:[(o.documents||[]).length," document",(o.documents||[]).length!==1?"s":""]})]})]}),e.jsx("div",{className:"project-detail-tabs",children:F.map(t=>e.jsx("button",{className:`project-detail-tab${d===t.id?" active":""}`,onClick:()=>g(t.id),children:t.label},t.id))}),e.jsxs("div",{children:[d==="documents"&&e.jsx(B,{project:o,onProjectChange:p}),d==="timeline"&&e.jsx(A,{project:o}),d==="terms"&&e.jsx(I,{project:o}),d==="chat"&&e.jsx(R,{project:o})]})]})}export{L as default};
