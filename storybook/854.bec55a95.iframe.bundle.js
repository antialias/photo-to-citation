"use strict";(self.webpackChunkapp_scaffold=self.webpackChunkapp_scaffold||[]).push([[854],{"./node_modules/@radix-ui/react-compose-refs/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{s:()=>useComposedRefs,t:()=>composeRefs});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/next/dist/compiled/react/index.js");function setRef(ref,value){if("function"==typeof ref)return ref(value);null!=ref&&(ref.current=value)}function composeRefs(...refs){return node=>{let hasCleanup=!1;const cleanups=refs.map(ref=>{const cleanup=setRef(ref,node);return hasCleanup||"function"!=typeof cleanup||(hasCleanup=!0),cleanup});if(hasCleanup)return()=>{for(let i=0;i<cleanups.length;i++){const cleanup=cleanups[i];"function"==typeof cleanup?cleanup():setRef(refs[i],null)}}}}function useComposedRefs(...refs){return react__WEBPACK_IMPORTED_MODULE_0__.useCallback(composeRefs(...refs),refs)}},"./node_modules/@radix-ui/react-context/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{A:()=>createContextScope,q:()=>createContext2});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/next/dist/compiled/react/index.js"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/next/dist/compiled/react/jsx-runtime.js");function createContext2(rootComponentName,defaultContext){const Context=react__WEBPACK_IMPORTED_MODULE_0__.createContext(defaultContext),Provider=props=>{const{children,...context}=props,value=react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>context,Object.values(context));return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(Context.Provider,{value,children})};return Provider.displayName=rootComponentName+"Provider",[Provider,function useContext2(consumerName){const context=react__WEBPACK_IMPORTED_MODULE_0__.useContext(Context);if(context)return context;if(void 0!==defaultContext)return defaultContext;throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``)}]}function createContextScope(scopeName,createContextScopeDeps=[]){let defaultContexts=[];const createScope=()=>{const scopeContexts=defaultContexts.map(defaultContext=>react__WEBPACK_IMPORTED_MODULE_0__.createContext(defaultContext));return function useScope(scope){const contexts=scope?.[scopeName]||scopeContexts;return react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>({[`__scope${scopeName}`]:{...scope,[scopeName]:contexts}}),[scope,contexts])}};return createScope.scopeName=scopeName,[function createContext3(rootComponentName,defaultContext){const BaseContext=react__WEBPACK_IMPORTED_MODULE_0__.createContext(defaultContext),index=defaultContexts.length;defaultContexts=[...defaultContexts,defaultContext];const Provider=props=>{const{scope,children,...context}=props,Context=scope?.[scopeName]?.[index]||BaseContext,value=react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>context,Object.values(context));return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(Context.Provider,{value,children})};return Provider.displayName=rootComponentName+"Provider",[Provider,function useContext2(consumerName,scope){const Context=scope?.[scopeName]?.[index]||BaseContext,context=react__WEBPACK_IMPORTED_MODULE_0__.useContext(Context);if(context)return context;if(void 0!==defaultContext)return defaultContext;throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``)}]},composeContextScopes(createScope,...createContextScopeDeps)]}function composeContextScopes(...scopes){const baseScope=scopes[0];if(1===scopes.length)return baseScope;const createScope=()=>{const scopeHooks=scopes.map(createScope2=>({useScope:createScope2(),scopeName:createScope2.scopeName}));return function useComposedScopes(overrideScopes){const nextScopes=scopeHooks.reduce((nextScopes2,{useScope,scopeName})=>({...nextScopes2,...useScope(overrideScopes)[`__scope${scopeName}`]}),{});return react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>({[`__scope${baseScope.scopeName}`]:nextScopes}),[nextScopes])}};return createScope.scopeName=baseScope.scopeName,createScope}},"./node_modules/@radix-ui/react-primitive/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{hO:()=>dispatchDiscreteCustomEvent,sG:()=>Primitive});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/next/dist/compiled/react/index.js"),react_dom__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/next/dist/compiled/react-dom/index.js"),_radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./node_modules/@radix-ui/react-slot/dist/index.mjs"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/next/dist/compiled/react/jsx-runtime.js"),Primitive=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"].reduce((primitive,node)=>{const Slot=(0,_radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_3__.TL)(`Primitive.${node}`),Node=react__WEBPACK_IMPORTED_MODULE_0__.forwardRef((props,forwardedRef)=>{const{asChild,...primitiveProps}=props,Comp=asChild?Slot:node;return"undefined"!=typeof window&&(window[Symbol.for("radix-ui")]=!0),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Comp,{...primitiveProps,ref:forwardedRef})});return Node.displayName=`Primitive.${node}`,{...primitive,[node]:Node}},{});function dispatchDiscreteCustomEvent(target,event){target&&react_dom__WEBPACK_IMPORTED_MODULE_1__.flushSync(()=>target.dispatchEvent(event))}},"./node_modules/@radix-ui/react-slot/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{TL:()=>createSlot});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/next/dist/compiled/react/index.js"),_radix_ui_react_compose_refs__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/@radix-ui/react-compose-refs/dist/index.mjs"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/next/dist/compiled/react/jsx-runtime.js");function createSlot(ownerName){const SlotClone=createSlotClone(ownerName),Slot2=react__WEBPACK_IMPORTED_MODULE_0__.forwardRef((props,forwardedRef)=>{const{children,...slotProps}=props,childrenArray=react__WEBPACK_IMPORTED_MODULE_0__.Children.toArray(children),slottable=childrenArray.find(isSlottable);if(slottable){const newElement=slottable.props.children,newChildren=childrenArray.map(child=>child===slottable?react__WEBPACK_IMPORTED_MODULE_0__.Children.count(newElement)>1?react__WEBPACK_IMPORTED_MODULE_0__.Children.only(null):react__WEBPACK_IMPORTED_MODULE_0__.isValidElement(newElement)?newElement.props.children:null:child);return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SlotClone,{...slotProps,ref:forwardedRef,children:react__WEBPACK_IMPORTED_MODULE_0__.isValidElement(newElement)?react__WEBPACK_IMPORTED_MODULE_0__.cloneElement(newElement,void 0,newChildren):null})}return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(SlotClone,{...slotProps,ref:forwardedRef,children})});return Slot2.displayName=`${ownerName}.Slot`,Slot2}function createSlotClone(ownerName){const SlotClone=react__WEBPACK_IMPORTED_MODULE_0__.forwardRef((props,forwardedRef)=>{const{children,...slotProps}=props;if(react__WEBPACK_IMPORTED_MODULE_0__.isValidElement(children)){const childrenRef=function getElementRef(element){let getter=Object.getOwnPropertyDescriptor(element.props,"ref")?.get,mayWarn=getter&&"isReactWarning"in getter&&getter.isReactWarning;if(mayWarn)return element.ref;if(getter=Object.getOwnPropertyDescriptor(element,"ref")?.get,mayWarn=getter&&"isReactWarning"in getter&&getter.isReactWarning,mayWarn)return element.props.ref;return element.props.ref||element.ref}(children),props2=function mergeProps(slotProps,childProps){const overrideProps={...childProps};for(const propName in childProps){const slotPropValue=slotProps[propName],childPropValue=childProps[propName];/^on[A-Z]/.test(propName)?slotPropValue&&childPropValue?overrideProps[propName]=(...args)=>{const result=childPropValue(...args);return slotPropValue(...args),result}:slotPropValue&&(overrideProps[propName]=slotPropValue):"style"===propName?overrideProps[propName]={...slotPropValue,...childPropValue}:"className"===propName&&(overrideProps[propName]=[slotPropValue,childPropValue].filter(Boolean).join(" "))}return{...slotProps,...overrideProps}}(slotProps,children.props);return children.type!==react__WEBPACK_IMPORTED_MODULE_0__.Fragment&&(props2.ref=forwardedRef?(0,_radix_ui_react_compose_refs__WEBPACK_IMPORTED_MODULE_2__.t)(forwardedRef,childrenRef):childrenRef),react__WEBPACK_IMPORTED_MODULE_0__.cloneElement(children,props2)}return react__WEBPACK_IMPORTED_MODULE_0__.Children.count(children)>1?react__WEBPACK_IMPORTED_MODULE_0__.Children.only(null):null});return SlotClone.displayName=`${ownerName}.SlotClone`,SlotClone}var SLOTTABLE_IDENTIFIER=Symbol("radix.slottable");function isSlottable(child){return react__WEBPACK_IMPORTED_MODULE_0__.isValidElement(child)&&"function"==typeof child.type&&"__radixId"in child.type&&child.type.__radixId===SLOTTABLE_IDENTIFIER}},"./node_modules/react-hot-toast/dist/index.mjs":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{l$:()=>Oe,oR:()=>dist_c});var react=__webpack_require__("./node_modules/next/dist/compiled/react/index.js");let e={data:""},t=t=>"object"==typeof window?((t?t.querySelector("#_goober"):window._goober)||Object.assign((t||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:t||e,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,a=/\/\*[^]*?\*\/|  +/g,n=/\n+/g,o=(e,t)=>{let r="",l="",a="";for(let n in e){let c=e[n];"@"==n[0]?"i"==n[1]?r=n+" "+c+";":l+="f"==n[1]?o(c,n):n+"{"+o(c,"k"==n[1]?"":t)+"}":"object"==typeof c?l+=o(c,t?t.replace(/([^,])+/g,e=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):n):null!=c&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=o.p?o.p(n,c):n+":"+c+";")}return r+(t&&a?t+"{"+a+"}":a)+l},c={},s=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+s(e[r]);return t}return e},i=(e,t,r,i,p)=>{let u=s(e),d=c[u]||(c[u]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(u));if(!c[d]){let t=u!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(a,""));)t[4]?o.shift():t[3]?(r=t[3].replace(n," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(n," ").trim();return o[0]})(e);c[d]=o(p?{["@keyframes "+d]:t}:t,r?"":"."+d)}let f=r&&c.g?c.g:null;return r&&(c.g=c[d]),((e,t,r,l)=>{l?t.data=t.data.replace(l,e):-1===t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e)})(c[d],t,i,f),d};function u(e){let r=this||{},l=e.call?e(r.p):e;return i(l.unshift?l.raw?((e,t,r)=>e.reduce((e,l,a)=>{let n=t[a];if(n&&n.call){let e=n(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;n=t?"."+t:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+l+(null==n?"":n)},""))(l,[].slice.call(arguments,1),r.p):l.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):l,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let d,f,g,h=u.bind({k:1});function j(e,t){let r=this||{};return function(){let l=arguments;function a(n,o){let c=Object.assign({},n),s=c.className||a.className;r.p=Object.assign({theme:f&&f()},c),r.o=/ *go\d+/.test(s),c.className=u.apply(r,l)+(s?" "+s:""),t&&(c.ref=o);let i=e;return e[0]&&(i=c.as||e,delete c.as),g&&i[0]&&g(c),d(i,c)}return t?t(a):a}}var dist_f=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,F=(()=>{let e=0;return()=>(++e).toString()})(),A=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),U=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(o=>o.id===t.toast.id?{...o,...t.toast}:o)};case 2:let{toast:r}=t;return U(e,{type:e.toasts.find(o=>o.id===r.id)?1:0,toast:r});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(o=>o.id===s||void 0===s?{...o,dismissed:!0,visible:!1}:o)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(o=>o.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(o=>({...o,pauseDuration:o.pauseDuration+a}))}}},P=[],y={toasts:[],pausedAt:void 0},dist_u=e=>{y=U(y,e),P.forEach(t=>{t(y)})},q={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},x=e=>(t,r)=>{let s=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||F()}))(t,e,r);return dist_u({type:2,toast:s}),s.id},dist_c=(e,t)=>x("blank")(e,t);dist_c.error=x("error"),dist_c.success=x("success"),dist_c.loading=x("loading"),dist_c.custom=x("custom"),dist_c.dismiss=e=>{dist_u({type:3,toastId:e})},dist_c.remove=e=>dist_u({type:4,toastId:e}),dist_c.promise=(e,t,r)=>{let s=dist_c.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(a=>{let o=t.success?dist_f(t.success,a):void 0;return o?dist_c.success(o,{id:s,...r,...null==r?void 0:r.success}):dist_c.dismiss(s),a}).catch(a=>{let o=t.error?dist_f(t.error,a):void 0;o?dist_c.error(o,{id:s,...r,...null==r?void 0:r.error}):dist_c.dismiss(s)}),e};var K=(e,t)=>{dist_u({type:1,toast:{id:e,height:t}})},X=()=>{dist_u({type:5,time:Date.now()})},dist_b=new Map,O=e=>{let{toasts:t,pausedAt:r}=((e={})=>{let[t,r]=(0,react.useState)(y),s=(0,react.useRef)(y);(0,react.useEffect)(()=>(s.current!==y&&r(y),P.push(r),()=>{let o=P.indexOf(r);o>-1&&P.splice(o,1)}),[]);let a=t.toasts.map(o=>{var n,i,p;return{...e,...e[o.type],...o,removeDelay:o.removeDelay||(null==(n=e[o.type])?void 0:n.removeDelay)||(null==e?void 0:e.removeDelay),duration:o.duration||(null==(i=e[o.type])?void 0:i.duration)||(null==e?void 0:e.duration)||q[o.type],style:{...e.style,...null==(p=e[o.type])?void 0:p.style,...o.style}}});return{...t,toasts:a}})(e);(0,react.useEffect)(()=>{if(r)return;let o=Date.now(),n=t.map(i=>{if(i.duration===1/0)return;let p=(i.duration||0)+i.pauseDuration-(o-i.createdAt);if(!(p<0))return setTimeout(()=>dist_c.dismiss(i.id),p);i.visible&&dist_c.dismiss(i.id)});return()=>{n.forEach(i=>i&&clearTimeout(i))}},[t,r]);let s=(0,react.useCallback)(()=>{r&&dist_u({type:6,time:Date.now()})},[r]),a=(0,react.useCallback)((o,n)=>{let{reverseOrder:i=!1,gutter:p=8,defaultPosition:d}=n||{},h=t.filter(m=>(m.position||d)===(o.position||d)&&m.height),v=h.findIndex(m=>m.id===o.id),S=h.filter((m,E)=>E<v&&m.visible).length;return h.filter(m=>m.visible).slice(...i?[S+1]:[0,S]).reduce((m,E)=>m+(E.height||0)+p,0)},[t]);return(0,react.useEffect)(()=>{t.forEach(o=>{if(o.dismissed)((e,t=1e3)=>{if(dist_b.has(e))return;let r=setTimeout(()=>{dist_b.delete(e),dist_u({type:4,toastId:e})},t);dist_b.set(e,r)})(o.id,o.removeDelay);else{let n=dist_b.get(o.id);n&&(clearTimeout(n),dist_b.delete(o.id))}})},[t]),{toasts:t,handlers:{updateHeight:K,startPause:X,endPause:s,calculateOffset:a}}},oe=h`
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
`,Oe=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:s,children:a,containerStyle:o,containerClassName:n})=>{let{toasts:i,handlers:p}=O(r);return react.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...o},className:n,onMouseEnter:p.startPause,onMouseLeave:p.endPause},i.map(d=>{let h=d.position||t,S=((e,t)=>{let r=e.includes("top"),s=r?{top:0}:{bottom:0},a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:A()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...s,...a}})(h,p.calculateOffset(d,{reverseOrder:e,gutter:s,defaultPosition:t}));return react.createElement(ve,{id:d.id,key:d.id,onHeightUpdate:p.updateHeight,className:d.visible?De:"",style:S},"custom"===d.type?dist_f(d.message,d):a?a(d):react.createElement(C,{toast:d,position:h}))}))}}}]);
//# sourceMappingURL=854.bec55a95.iframe.bundle.js.map