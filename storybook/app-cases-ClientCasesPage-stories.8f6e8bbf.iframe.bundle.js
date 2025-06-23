"use strict";(self.webpackChunkapp_scaffold=self.webpackChunkapp_scaffold||[]).push([[590],{"./node_modules/react-hot-toast/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{l$:()=>Oe,oR:()=>dist_c});var react=__webpack_require__("./node_modules/next/dist/compiled/react/index.js");let e={data:""},t=t=>"object"==typeof window?((t?t.querySelector("#_goober"):window._goober)||Object.assign((t||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:t||e,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,a=/\/\*[^]*?\*\/|  +/g,n=/\n+/g,o=(e,t)=>{let r="",l="",a="";for(let n in e){let c=e[n];"@"==n[0]?"i"==n[1]?r=n+" "+c+";":l+="f"==n[1]?o(c,n):n+"{"+o(c,"k"==n[1]?"":t)+"}":"object"==typeof c?l+=o(c,t?t.replace(/([^,])+/g,e=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):n):null!=c&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=o.p?o.p(n,c):n+":"+c+";")}return r+(t&&a?t+"{"+a+"}":a)+l},c={},s=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+s(e[r]);return t}return e},i=(e,t,r,i,p)=>{let u=s(e),d=c[u]||(c[u]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(u));if(!c[d]){let t=u!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(a,""));)t[4]?o.shift():t[3]?(r=t[3].replace(n," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(n," ").trim();return o[0]})(e);c[d]=o(p?{["@keyframes "+d]:t}:t,r?"":"."+d)}let f=r&&c.g?c.g:null;return r&&(c.g=c[d]),((e,t,r,l)=>{l?t.data=t.data.replace(l,e):-1===t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e)})(c[d],t,i,f),d};function u(e){let r=this||{},l=e.call?e(r.p):e;return i(l.unshift?l.raw?((e,t,r)=>e.reduce((e,l,a)=>{let n=t[a];if(n&&n.call){let e=n(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;n=t?"."+t:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+l+(null==n?"":n)},""))(l,[].slice.call(arguments,1),r.p):l.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):l,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let d,f,g,h=u.bind({k:1});function j(e,t){let r=this||{};return function(){let l=arguments;function a(n,o){let c=Object.assign({},n),s=c.className||a.className;r.p=Object.assign({theme:f&&f()},c),r.o=/ *go\d+/.test(s),c.className=u.apply(r,l)+(s?" "+s:""),t&&(c.ref=o);let i=e;return e[0]&&(i=c.as||e,delete c.as),g&&i[0]&&g(c),d(i,c)}return t?t(a):a}}var dist_f=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,F=(()=>{let e=0;return()=>(++e).toString()})(),A=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),U=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(o=>o.id===t.toast.id?{...o,...t.toast}:o)};case 2:let{toast:r}=t;return U(e,{type:e.toasts.find(o=>o.id===r.id)?1:0,toast:r});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(o=>o.id===s||void 0===s?{...o,dismissed:!0,visible:!1}:o)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(o=>o.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(o=>({...o,pauseDuration:o.pauseDuration+a}))}}},P=[],y={toasts:[],pausedAt:void 0},dist_u=e=>{y=U(y,e),P.forEach(t=>{t(y)})},q={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},x=e=>(t,r)=>{let s=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||F()}))(t,e,r);return dist_u({type:2,toast:s}),s.id},dist_c=(e,t)=>x("blank")(e,t);dist_c.error=x("error"),dist_c.success=x("success"),dist_c.loading=x("loading"),dist_c.custom=x("custom"),dist_c.dismiss=e=>{dist_u({type:3,toastId:e})},dist_c.remove=e=>dist_u({type:4,toastId:e}),dist_c.promise=(e,t,r)=>{let s=dist_c.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(a=>{let o=t.success?dist_f(t.success,a):void 0;return o?dist_c.success(o,{id:s,...r,...null==r?void 0:r.success}):dist_c.dismiss(s),a}).catch(a=>{let o=t.error?dist_f(t.error,a):void 0;o?dist_c.error(o,{id:s,...r,...null==r?void 0:r.error}):dist_c.dismiss(s)}),e};var K=(e,t)=>{dist_u({type:1,toast:{id:e,height:t}})},X=()=>{dist_u({type:5,time:Date.now()})},dist_b=new Map,O=e=>{let{toasts:t,pausedAt:r}=((e={})=>{let[t,r]=(0,react.useState)(y),s=(0,react.useRef)(y);(0,react.useEffect)(()=>(s.current!==y&&r(y),P.push(r),()=>{let o=P.indexOf(r);o>-1&&P.splice(o,1)}),[]);let a=t.toasts.map(o=>{var n,i,p;return{...e,...e[o.type],...o,removeDelay:o.removeDelay||(null==(n=e[o.type])?void 0:n.removeDelay)||(null==e?void 0:e.removeDelay),duration:o.duration||(null==(i=e[o.type])?void 0:i.duration)||(null==e?void 0:e.duration)||q[o.type],style:{...e.style,...null==(p=e[o.type])?void 0:p.style,...o.style}}});return{...t,toasts:a}})(e);(0,react.useEffect)(()=>{if(r)return;let o=Date.now(),n=t.map(i=>{if(i.duration===1/0)return;let p=(i.duration||0)+i.pauseDuration-(o-i.createdAt);if(!(p<0))return setTimeout(()=>dist_c.dismiss(i.id),p);i.visible&&dist_c.dismiss(i.id)});return()=>{n.forEach(i=>i&&clearTimeout(i))}},[t,r]);let s=(0,react.useCallback)(()=>{r&&dist_u({type:6,time:Date.now()})},[r]),a=(0,react.useCallback)((o,n)=>{let{reverseOrder:i=!1,gutter:p=8,defaultPosition:d}=n||{},h=t.filter(m=>(m.position||d)===(o.position||d)&&m.height),v=h.findIndex(m=>m.id===o.id),S=h.filter((m,E)=>E<v&&m.visible).length;return h.filter(m=>m.visible).slice(...i?[S+1]:[0,S]).reduce((m,E)=>m+(E.height||0)+p,0)},[t]);return(0,react.useEffect)(()=>{t.forEach(o=>{if(o.dismissed)((e,t=1e3)=>{if(dist_b.has(e))return;let r=setTimeout(()=>{dist_b.delete(e),dist_u({type:4,toastId:e})},t);dist_b.set(e,r)})(o.id,o.removeDelay);else{let n=dist_b.get(o.id);n&&(clearTimeout(n),dist_b.delete(o.id))}})},[t]),{toasts:t,handlers:{updateHeight:K,startPause:X,endPause:s,calculateOffset:a}}},oe=h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,re=h`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,se=h`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,k=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${oe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${re} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${se} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ne=h`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,V=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ne} 1s linear infinite;
`,pe=h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,de=h`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,_=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${pe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${de} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ue=j("div")`
  position: absolute;
`,le=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,fe=h`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Te=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${fe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,M=({toast:e})=>{let{icon:t,type:r,iconTheme:s}=e;return void 0!==t?"string"==typeof t?react.createElement(Te,null,t):t:"blank"===r?null:react.createElement(le,null,react.createElement(V,{...s}),"loading"!==r&&react.createElement(ue,null,"error"===r?react.createElement(k,{...s}):react.createElement(_,{...s})))},ye=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,ge=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,be=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Se=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,C=react.memo(({toast:e,position:t,style:r,children:s})=>{let a=e.height?((e,t)=>{let s=e.includes("top")?1:-1,[a,o]=A()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[ye(s),ge(s)];return{animation:t?`${h(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${h(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},o=react.createElement(M,{toast:e}),n=react.createElement(Se,{...e.ariaProps},dist_f(e.message,e));return react.createElement(be,{className:e.className,style:{...a,...r,...e.style}},"function"==typeof s?s({icon:o,message:n}):react.createElement(react.Fragment,null,o,n))});!function m(e,t,r,l){o.p=t,d=e,f=r,g=l}(react.createElement);var ve=({id:e,className:t,style:r,onHeightUpdate:s,children:a})=>{let o=react.useCallback(n=>{if(n){let i=()=>{let p=n.getBoundingClientRect().height;s(e,p)};i(),new MutationObserver(i).observe(n,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return react.createElement("div",{ref:o,className:t,style:r},a)},De=u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,Oe=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:s,children:a,containerStyle:o,containerClassName:n})=>{let{toasts:i,handlers:p}=O(r);return react.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...o},className:n,onMouseEnter:p.startPause,onMouseLeave:p.endPause},i.map(d=>{let h=d.position||t,S=((e,t)=>{let r=e.includes("top"),s=r?{top:0}:{bottom:0},a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:A()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...s,...a}})(h,p.calculateOffset(d,{reverseOrder:e,gutter:s,defaultPosition:t}));return react.createElement(ve,{id:d.id,key:d.id,onHeightUpdate:p.updateHeight,className:d.visible?De:"",style:S},"custom"===d.type?dist_f(d.message,d):a?a(d):react.createElement(C,{toast:d,position:h}))}))}},"./src/app/cases/ClientCasesPage.stories.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{MultipleCases:()=>MultipleCases,SelectedCase:()=>SelectedCase,__namedExportsOrder:()=>__namedExportsOrder,default:()=>ClientCasesPage_stories});var jsx_runtime=__webpack_require__("./node_modules/next/dist/compiled/react/jsx-runtime.js"),apiClient=__webpack_require__("./src/apiClient.ts"),AnalysisInfo=__webpack_require__("./src/app/components/AnalysisInfo.tsx"),MapPreviewStub=__webpack_require__("./.storybook/MapPreviewStub.tsx"),useNewCaseFromFiles=__webpack_require__("./src/app/useNewCaseFromFiles.ts"),caseUtils=__webpack_require__("./src/lib/caseUtils.ts"),clientThumbnails=__webpack_require__("./src/lib/clientThumbnails.ts");const WGS84_F=1/298.257223563;function toRad(deg){return deg*Math.PI/180}function distanceBetween(a,b){const L=toRad(b.lon-a.lon),U1=Math.atan((1-WGS84_F)*Math.tan(toRad(a.lat))),U2=Math.atan((1-WGS84_F)*Math.tan(toRad(b.lat))),sinU1=Math.sin(U1),cosU1=Math.cos(U1),sinU2=Math.sin(U2),cosU2=Math.cos(U2);let lambda=L,lambdaP=0,iter=0,cosSqAlpha=0,sinSigma=0,cosSigma=0,sigma=0,cos2SigmaM=0;do{const sinLambda=Math.sin(lambda),cosLambda=Math.cos(lambda);if(sinSigma=Math.sqrt((cosU2*sinLambda)**2+(cosU1*sinU2-sinU1*cosU2*cosLambda)**2),0===sinSigma)return 0;cosSigma=sinU1*sinU2+cosU1*cosU2*cosLambda,sigma=Math.atan2(sinSigma,cosSigma);const sinAlpha=cosU1*cosU2*sinLambda/sinSigma;cosSqAlpha=1-sinAlpha**2,cos2SigmaM=0!==cosSqAlpha?cosSigma-2*sinU1*sinU2/cosSqAlpha:0;const C=WGS84_F/16*cosSqAlpha*(4+WGS84_F*(4-3*cosSqAlpha));lambdaP=lambda,lambda=L+(1-C)*WGS84_F*sinAlpha*(sigma+C*sinSigma*(cos2SigmaM+C*cosSigma*(2*cos2SigmaM**2-1)))}while(Math.abs(lambda-lambdaP)>1e-12&&++iter<1e3);const uSq=272331606109.84375*cosSqAlpha/40408299984659.16,B=uSq/1024*(256+uSq*(uSq*(74-47*uSq)-128));return 6356752.314245*(1+uSq/16384*(4096+uSq*(uSq*(320-175*uSq)-768)))*(sigma-B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(2*cos2SigmaM**2-1)-B/6*cos2SigmaM*(4*sinSigma**2-3)*(4*cos2SigmaM**2-3))))}var next_image=__webpack_require__("./node_modules/@storybook/nextjs/dist/images/next-image.mjs"),navigation=__webpack_require__("./node_modules/@storybook/nextjs/dist/export-mocks/navigation/index.mjs"),react=__webpack_require__("./node_modules/next/dist/compiled/react/index.js"),NotificationProvider=__webpack_require__("./src/app/components/NotificationProvider.tsx"),useDragReset=__webpack_require__("./src/app/cases/useDragReset.ts");function sortList(list,key,location){if("distance"===key&&location)return[...list].sort((a,b)=>{const ag=(0,caseUtils.qR)(a),bg=(0,caseUtils.qR)(b);return ag||bg?ag?bg?distanceBetween(location,ag)-distanceBetween(location,bg):-1:1:0});const k=key;return[...list].sort((a,b)=>{var _b_k,_a_k;return new Date(null!==(_b_k=b[k])&&void 0!==_b_k?_b_k:b.createdAt).getTime()-new Date(null!==(_a_k=a[k])&&void 0!==_a_k?_a_k:a.createdAt).getTime()})}function ClientCasesPage({initialCases}){var _searchParams_get;const[orderBy,setOrderBy]=(0,react.useState)("createdAt"),[cases,setCases]=(0,react.useState)(()=>sortList(initialCases,"createdAt")),[userLocation,setUserLocation]=(0,react.useState)(null),router=(0,navigation.useRouter)(),uploadNewCase=(0,useNewCaseFromFiles.A)(),[dragging,setDragging]=(0,react.useState)(!1),[dropCase,setDropCase]=(0,react.useState)(null),notify=(0,NotificationProvider.l)(),params=(0,navigation.useParams)();var _searchParams_get_split_filter;const selectedIds=null!==(_searchParams_get_split_filter=null===(_searchParams_get=(0,navigation.useSearchParams)().get("ids"))||void 0===_searchParams_get?void 0:_searchParams_get.split(",").filter(Boolean))&&void 0!==_searchParams_get_split_filter?_searchParams_get_split_filter:params.id?[params.id]:[];return(0,react.useEffect)(()=>{const es=(0,apiClient.a)("/api/cases/stream");return es.onmessage=e=>{const data=JSON.parse(e.data);setCases(prev=>{if(data.deleted)return sortList(prev.filter(c=>c.id!==data.id),orderBy,userLocation);const idx=prev.findIndex(c=>c.id===data.id);if(-1===idx)return sortList([...prev,data],orderBy,userLocation);const copy=[...prev];return copy[idx]=data,sortList(copy,orderBy,userLocation)})},()=>es.close()},[orderBy,userLocation]),(0,react.useEffect)(()=>{setCases(prev=>sortList(prev,orderBy,userLocation))},[orderBy,userLocation]),(0,react.useEffect)(()=>{"distance"===orderBy&&!userLocation&&navigator.geolocation&&navigator.geolocation.getCurrentPosition(pos=>{setUserLocation({lat:pos.coords.latitude,lon:pos.coords.longitude})})},[orderBy,userLocation]),(0,useDragReset.A)(()=>{setDragging(!1),setDropCase(null)}),(0,jsx_runtime.jsxs)("div",{className:"p-8 relative h-full",onDragOver:e=>e.preventDefault(),onDragEnter:e=>{e.preventDefault(),setDragging(!0)},onDragLeave:e=>{e.currentTarget.contains(e.relatedTarget)||(setDragging(!1),setDropCase(null))},onDrop:async e=>{e.preventDefault();const files=e.dataTransfer.files;dropCase?await async function uploadFilesToCase(id,files){(await Promise.all(Array.from(files).map(file=>{const formData=new FormData;return formData.append("photo",file),formData.append("caseId",id),(0,apiClient.n)("/api/upload",{method:"POST",body:formData})}))).some(r=>!r.ok)&&notify("Failed to upload one or more files.")}(dropCase,files):await uploadNewCase(files),setDragging(!1),setDropCase(null)},children:[(0,jsx_runtime.jsx)("h1",{className:"text-xl font-bold mb-4",children:"Cases"}),(0,jsx_runtime.jsxs)("div",{className:"mb-4",children:[(0,jsx_runtime.jsx)("label",{className:"mr-2",htmlFor:"order",children:"Order by:"}),(0,jsx_runtime.jsxs)("select",{id:"order",value:orderBy,onChange:e=>setOrderBy(e.target.value),className:"border rounded p-1 bg-white dark:bg-gray-900",children:[(0,jsx_runtime.jsx)("option",{value:"createdAt",children:"Creation Date"}),(0,jsx_runtime.jsx)("option",{value:"updatedAt",children:"Last Updated"}),(0,jsx_runtime.jsx)("option",{value:"distance",children:"Distance from My Location"})]})]}),(0,jsx_runtime.jsx)("ul",{className:"grid gap-4",children:cases.map(c=>(0,jsx_runtime.jsx)("li",{onDragEnter:()=>{setDropCase(c.id),setDragging(!0)},onDragLeave:e=>{e.currentTarget.contains(e.relatedTarget)||setDropCase(null)},className:"border p-2 "+(selectedIds.includes(c.id)?"bg-gray-100 dark:bg-gray-800 ring-2 ring-blue-500":dropCase===c.id?"ring-2 ring-green-500":"ring-1 ring-transparent"),children:(0,jsx_runtime.jsxs)("button",{type:"button",onClick:e=>{if(e.shiftKey){const ids=Array.from(new Set([...selectedIds,c.id]));router.push(`/cases?ids=${ids.join(",")}`)}else router.push(`/cases/${c.id}`)},className:"flex flex-col sm:flex-row lg:flex-col items-start gap-2 sm:gap-4 w-full text-left",children:[(0,jsx_runtime.jsxs)("div",{className:"relative",children:[(()=>{const photo=(0,caseUtils.wq)(c);return photo?(0,jsx_runtime.jsx)(next_image.A,{src:(0,clientThumbnails.s)(photo,128),alt:"case thumbnail",width:120,height:90}):null})(),c.photos.length>1?(0,jsx_runtime.jsx)("span",{className:"absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs rounded px-1",children:c.photos.length}):null]}),(()=>{const g=(0,caseUtils.qR)(c);return g?(0,jsx_runtime.jsx)(MapPreviewStub.A,{lat:g.lat,lon:g.lon,width:120,height:90,className:"w-32 aspect-[4/3] lg:hidden"}):null})(),(0,jsx_runtime.jsxs)("div",{className:"flex flex-col text-sm gap-1",children:[(0,jsx_runtime.jsxs)("span",{className:"font-semibold",children:["Case ",c.id]}),c.analysis?(0,jsx_runtime.jsxs)(jsx_runtime.Fragment,{children:[(0,jsx_runtime.jsx)(AnalysisInfo.A,{analysis:c.analysis}),"pending"===c.analysisStatus?(0,jsx_runtime.jsx)("span",{className:"text-gray-500 dark:text-gray-400",children:"Updating analysis..."}):null]}):(0,jsx_runtime.jsx)("span",{className:"text-gray-500 dark:text-gray-400",children:"Analyzing photo..."})]})]})},c.id))}),dragging?(0,jsx_runtime.jsx)("div",{className:"absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10",children:dropCase?`Add photos to case ${dropCase}`:"Drop photos to create case"}):null]})}ClientCasesPage.__docgenInfo={description:"",methods:[],displayName:"ClientCasesPage",props:{initialCases:{required:!0,tsType:{name:"Array",elements:[{name:"Case"}],raw:"Case[]"},description:""}}};const ClientCasesPage_stories={component:ClientCasesPage,title:"Pages/ClientCasesPage"},caseBase={photos:["https://placehold.co/600x400?text=photo"],photoTimes:{},createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),gps:{lat:41.88,lon:-87.78},streetAddress:null,intersection:null,vin:null,vinOverride:null,analysis:null,analysisOverrides:null,analysisStatus:"pending",analysisStatusCode:null,public:!1,sentEmails:[],ownershipRequests:[]},MultipleCases={render:()=>{const cases=[{id:"1",...caseBase,analysis:{violationType:"parking",details:"Blocking sidewalk",vehicle:{licensePlateNumber:"ABC123"},location:"Oak Park",images:{}},analysisStatus:"complete"},{id:"2",...caseBase,photos:["https://placehold.co/600x400?text=photo2","https://placehold.co/601x400?text=photo3"]}];return(0,jsx_runtime.jsx)(ClientCasesPage,{initialCases:cases})}},SelectedCase={render:()=>{const cases=[{id:"1",...caseBase},{id:"2",...caseBase}];return(0,jsx_runtime.jsx)(ClientCasesPage,{initialCases:cases})}},__namedExportsOrder=["MultipleCases","SelectedCase"];MultipleCases.parameters={...MultipleCases.parameters,docs:{...MultipleCases.parameters?.docs,source:{originalSource:'{\n  render: () => {\n    const cases: Case[] = [{\n      id: "1",\n      ...caseBase,\n      analysis: {\n        violationType: "parking",\n        details: "Blocking sidewalk",\n        vehicle: {\n          licensePlateNumber: "ABC123"\n        },\n        location: "Oak Park",\n        images: {}\n      },\n      analysisStatus: "complete"\n    }, {\n      id: "2",\n      ...caseBase,\n      photos: ["https://placehold.co/600x400?text=photo2", "https://placehold.co/601x400?text=photo3"]\n    }];\n    return <ClientCasesPage initialCases={cases} />;\n  }\n}',...MultipleCases.parameters?.docs?.source}}},SelectedCase.parameters={...SelectedCase.parameters,docs:{...SelectedCase.parameters?.docs,source:{originalSource:'{\n  render: () => {\n    const cases: Case[] = [{\n      id: "1",\n      ...caseBase\n    }, {\n      id: "2",\n      ...caseBase\n    }];\n    return <ClientCasesPage initialCases={cases} />;\n  }\n}',...SelectedCase.parameters?.docs?.source}}}},"./src/app/useNewCaseFromFiles.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>useNewCaseFromFiles});var _apiClient__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./src/apiClient.ts"),next_navigation__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/@storybook/nextjs/dist/export-mocks/navigation/index.mjs"),_components_NotificationProvider__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/app/components/NotificationProvider.tsx");function useNewCaseFromFiles(){const router=(0,next_navigation__WEBPACK_IMPORTED_MODULE_1__.useRouter)(),notify=(0,_components_NotificationProvider__WEBPACK_IMPORTED_MODULE_2__.l)();return async files=>{if(!files||0===files.length)return;const id=Date.now().toString(),preview=URL.createObjectURL(files[0]);sessionStorage.setItem(`preview-${id}`,preview);(await Promise.all(Array.from(files).map((file,idx)=>{const formData=new FormData;formData.append("photo",file),formData.append("caseId",id);const upload=(0,_apiClient__WEBPACK_IMPORTED_MODULE_0__.n)("/api/upload",{method:"POST",body:formData});return 0===idx&&upload.then(()=>{sessionStorage.removeItem(`preview-${id}`)}),upload}))).some(r=>!r.ok)?notify("Failed to upload one or more files."):router.push(`/cases/${id}`)}}}}]);
//# sourceMappingURL=app-cases-ClientCasesPage-stories.8f6e8bbf.iframe.bundle.js.map