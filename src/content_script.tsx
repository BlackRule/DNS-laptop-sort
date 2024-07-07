import {Message, Replacements, Scores} from "./types";
import {cpus, cpuScores01} from "./cpu_data";
import {gpuScores01} from "./gpu_data";
import {laptopsPrecomputedScore} from "./laptopsPrecomputedScore";

const cpuDataAttribName = 'CPU';
const gpuDataAttribName = 'GPU';
const laptopModelDataAttribName = 'laptop';
const laptopScoreDataAttribName = 'score';

function debuggerOrThrow(et?):never{
  debugger
  throw new Error(et)
}

type CompareFn=(element: Element, element2: Element)=>number

//returns fn that executes f only if f wasn't invoked for delay
function debounce(f:(...args)=>void,delay:number){
  let timeout:null|number=null
  return (...args)=>{
    if(timeout!=null) clearTimeout(timeout)
    timeout=setTimeout(()=>f(...args),delay)
  }
}

function extractTextCPU(element: Element) {
  if (element.firstElementChild?.firstChild?.nodeType !== Node.TEXT_NODE) return ''
  // @ts-ignore
  return (element.firstElementChild.firstChild.wholeText as string).trim()
}

function cpuPerformReplacements(name:string){
  //Apple M1
//Apple M1 Max
//Apple M1 Pro
//Apple M2
//Apple M2 Pro
//Apple M3
//Apple M3 Pro
  const replacements:Replacements = [
    ['Intel Core i7 13700H', 'Intel Core i7-13700H'],
    ['Intel Core i7-13620P', 'Intel Core i7-13620'], //fixme 13620P DOESN'T EXIST!
    ['Intel Processor', 'Intel'],
    [/(\d+)-core/,"$1 Core"], //Apple M
  ]
  for (const replacement of replacements) {
    name = name.replace(replacement[0], replacement[1])
  }
  return name
}

function gpuPerformReplacements(name:string){
  const replacements:Replacements = [
    [/Intel Iris (Xe|Plus) Graphics/, 'Intel Iris $1'],
    ['AMD', ''],
    ['Athlon Silver 3050U with Radeon Graphics','Radeon Athlon Silver 3050U'],
    [/ \d+ ГБ/,""],
    [" для ноутбуков"," Laptop GPU"],
    ["Apple M1 8-core","GeForce GTX 1650 (Mobile)"],
    ["Apple M1 Pro 16-core","GeForce RTX 3060 Laptop GPU"],
    ["Apple M2 10-core","GeForce GTX 1060 3GB"],
    ["Apple M3 10-core","GeForce GTX 1660"],
    ["Arc A350M","GeForce GTX 1650 (Mobile)"],
    ["Apple M2 Pro 16-core","APPLE_TODO"],
    ["Apple M2 Pro 19-core","APPLE_TODO"],
    ["Apple M3 Pro 18-core","APPLE_TODO"],
    ["Apple M1 Max 32-core","APPLE_TODO"],
  ]
  for (const replacement of replacements) {
    name = name.replace(replacement[0], replacement[1])
  }
  return name
}

function findCPUIndex(name:string) {
  let idx = cpus.lastIndexOf(cpuPerformReplacements(name))
  if (idx === -1) {
    debuggerOrThrow(`"${name}"`)
  }
  return idx
}

function findGPUIndex(name:string) {
  //TODO if not found => gpuScore = 2
  //Apple M1
//Apple M1 Max
//Apple M1 Pro
//Apple M2
//Apple M2 Pro
//Apple M3
//Apple M3 Pro
  const replacements = [
    ['Intel Core i7 13700H', 'Intel Core i7-13700H'],
    ['Intel Core i7-13620P', 'Intel Core i7-13620'], //fixme 13620P DOESN'T EXIST!
    ['Intel Processor', 'Intel'],
  ]
  for (const replacement of replacements) {
    name = name.replace(replacement[0], replacement[1])
  }
  let idx = cpus.lastIndexOf(name)
  if (idx === -1) {
    debuggerOrThrow(`"${name}"`)
  }
  return idx
}

function compareCPUs(element: Element, element2: Element) {
  let c1 = findCPUIndex(extractTextCPU(element))
  let c2 = findCPUIndex(extractTextCPU(element2))
  /*if (c2 - c1 > 0) {
        console.log(`swapped ${extractText(element)} and ${extractText(element2)}`)
    }*/
  return c1 - c2 //reversed
}

function compareLaptops(element: HTMLDivElement, element2: HTMLDivElement) {
  // @ts-ignore
  return element2.dataset[laptopScoreDataAttribName]! * 1 - element.dataset[laptopScoreDataAttribName]! * 1
}

function bubbleSort(parent:Element,compareFn:CompareFn){
  let swapped = true
  while (swapped) {
    swapped = false
    for (let i = 0; i < parent.childElementCount - 1; i++) {
      if (compareFn(parent.children[i], parent.children[i + 1]) > 0) {
        parent.insertBefore(parent.children[i + 1], parent.children[i])
        swapped = true
      }
    }
  }
}

function get(what: string, fromWhere: Scores):Scores{
  const r={}
  for (const [k,v] of Object.entries(fromWhere)) {
    if(k.includes(what)) r[k]=v
  }
  return r
}

function format(v:number){
  return v.toPrecision(3)
}

function f1(scores:Scores){
  return Object.entries(scores).map(([k,v])=>`${k} ~ ${format(v)}`).join('\n')
}

function assignDataAttributesToLaptopsAndMark(laptopsParent: HTMLSpanElement) {
  const missing={cpus:new Set(),gpus:new Set()}
  for (let i = 0; i < laptopsParent.childElementCount; i++) {
    const laptop = laptopsParent.children[i] as HTMLDivElement
    let text = (laptop.children[1]!/*a.catalog-product__name.ui-link.ui-link_black*/.firstChild! as HTMLSpanElement)/*span*/.innerText
    //TODO capture eMMC to storage
    const match = text.match(/(?<screenDiag>[\d.]+)"[^\[]+\[(?:английская раскладка, )?(?<screenResolution>[^,]+), (?<screenTech>[^,]+), (?<cpu>[^,]+)(?<cpuCores>, ([^,]+))?, RAM (?<ramN>\d+) ГБ, (?<storage>[^,]+),(?: eMMC 32 ГБ,)? (?<gpu>[^,]+), (?<os>[^\]]+)]?/)
    if (match === null || match.groups===undefined || Object.keys(match.groups).length < 9) debuggerOrThrow()
    let cpuName=cpuPerformReplacements(match.groups.cpu)
    let gpuName=gpuPerformReplacements(match.groups.gpu).trim()
    if (gpuName === 'Radeon Graphics') {
      gpuName = `${cpuName} with Radeon Graphics`.replace('AMD ', '')
      gpuName = gpuPerformReplacements(gpuName)
      if (gpuScores01[gpuName] === undefined) {
        gpuName = `Radeon ${cpuName}`.replace('AMD ', '')
      }
    }
    let s
    /*const laptopPrecomputedScore = laptopsPrecomputedScore[
      laptop.dataset[laptopModelDataAttribName]!
      ];
    if(laptopPrecomputedScore!==undefined) s=laptopPrecomputedScore
    else{*/
    const cpuScores=get(cpuName,cpuScores01)
    const gpuScores=get(gpuName,gpuScores01)
    const cpuScoresKeys=Object.keys(cpuScores)
    const gpuScoresKeys=Object.keys(gpuScores)
    if(cpuScoresKeys.length===0||gpuScoresKeys.length===0){
      if(cpuScoresKeys.length===0) missing.cpus.add(cpuName)
      if(gpuScoresKeys.length===0) missing.gpus.add(gpuName)
      continue
    }
    s=cpuScores[cpuScoresKeys[0]]+gpuScores[gpuScoresKeys[0]]
    /*}*/
    laptop.dataset[laptopScoreDataAttribName]=s.toString()
    const element = document.createElement('div');
    element.style.gridColumn="1/3"
    //FIXME Test this if works
    let special=''
    if(gpuName==="GeForce GTX 1660"&&cpuName==='Apple M3 10 Core')
      special=' class="yellowTDRTGDTRDT" title="TOTALLY NOT SURE"'
    if(gpuName==="APPLE_TODO")
      special=' class="redTDRTGDTRDT" title="TODO"'
    element.innerHTML=`
    <style>
    .falesfkejfkefjkefjk{
        font-size: 0.85em;
    }
    .falesfkejfkefjkefjk td{
        border: 1px solid black
    }
    .yellowTDRTGDTRDT{
    background-color: yellow;
    }
    .redTDRTGDTRDT{
        background-color: red;
    }
    </style>
    <table class="falesfkejfkefjkefjk">
        <tr><td>total</td><td>cpu</td><td>gpu</td></tr>
        <tr><td>${format(s)}</td><td>${f1(cpuScores)}</td><td${special}>${f1(gpuScores)}</td></tr>
    </table>
    `
    laptop.appendChild(element)
    //FIXME get rid of colors etc!
    //  match.groups.model
    //  laptop.dataset[laptopModelDataAttribName] = model.trim()
  }
  if(missing.cpus.size>0||missing.gpus.size>0){
    console.log("cpus",missing.cpus)
    console.log("gpus",missing.gpus)
    debuggerOrThrow("missing.cpus.size>0||missing.gpus.size>0")
  }
  console.log(`done assign data attributes to laptops`)
}

function sortLaptops(sendResponse){
  let success = true
  try {
    const selector = '.catalog-products.view-simple';
    let laptopsParent: HTMLSpanElement | null = document.querySelector(selector)
    if (laptopsParent === null) {
      debuggerOrThrow(`FAIL ${selector}`)
    } else {
      console.log(`found ${selector}`)
    }
    //merge all laptopsParents' children into first laptopsParent
    const laptopsParents=document.querySelectorAll(selector)
    for (let i = 1; i < laptopsParents.length; i++) {
      while (laptopsParents[i].childElementCount>0) {
        laptopsParent.appendChild(laptopsParents[i].firstElementChild!)
      }
    }
    console.log(`done merge all laptopsParents' children into first laptopsParent`)

    assignDataAttributesToLaptopsAndMark(laptopsParent);

    bubbleSort(laptopsParent, compareLaptops as ()=>number)
    console.log(`done bubbleSort(laptopsParent, compareLaptops)`)

  } catch (e) {
    console.log(e)
    success = false
  } finally {
    sendResponse("done");
    if (success) console.log("sort laptops DONE")
  }
}

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
  switch (msg) {
    case "sortCPUs": { //TODO make work with expanded Модель процессора as well
      // use mutation observer for that
      // `as HTMLSpanElement | null` is a fix to TS bug "Variable is of type 'never' after potential assignment in a forEach lambda"
      let success = true
      let element: HTMLSpanElement | null = null as HTMLSpanElement | null
      document.querySelectorAll('.ui-collapse__link-text').forEach((el) => {
        if (el.innerHTML === 'Модель процессора') {
          element = el as HTMLSpanElement
        }
      })
      try {

        if (element === null) {
          debuggerOrThrow('FAIL ui-collapse__link-text Модель процессора')
        } else {
          element.style.backgroundColor = 'red'
        }
        const cpuList = ((element.parentNode as ParentNode).parentNode as ParentNode).querySelector<HTMLDivElement>('.ui-checkbox-group_list')

        if (cpuList === null) {
          console.dir(element)
          debuggerOrThrow('FAIL parent')
        }

        for (let i = 0; i < cpuList.childElementCount; i++) {
          if (cpuList.children[i].firstElementChild?.querySelectorAll('.catalog-filter-count').length === 0) {
            cpuList.children[i].remove()
            i--
            continue
          }
          try {
            findCPUIndex(extractTextCPU(cpuList.children[i]))
          } catch (e) {
            console.log(extractTextCPU(cpuList.children[i]))
            throw e
          }
        }

        bubbleSort(cpuList, compareCPUs)

      } catch (e) {
        console.log(e)
        success = false
      } finally {
        sendResponse("done");
        if (element === null) return
        if (success) element.style.backgroundColor = 'green'
      }
    }
      break;
    case "autoShowMore":
      let clicksLeft=10
      let buttonShowMore=document.querySelector<HTMLButtonElement>("#products-list-pagination > button")
      if(buttonShowMore===null) debuggerOrThrow("buttonShowMore")
      const catalogPreloader=document.querySelector(".catalog-preloader")
      let firstTime=true
      const observer = new MutationObserver((mutationList, observer) => {
        if(!catalogPreloader?.classList.contains('catalog-preloader_active')){
          if(!firstTime) {
            setTimeout(()=>{
              if (clicksLeft > 0) {
                firstTime=true
                buttonShowMore=document.querySelector<HTMLButtonElement>("#products-list-pagination > button")
                if(buttonShowMore===null){
                  console.log("DONE")
                  return
                }
                console.log(buttonShowMore.dataset)
                buttonShowMore.click()
                clicksLeft--
                console.log("clicked")

              }
            },2000)
          }
          firstTime=false
        }
        /*for (const mutation of mutationList) {
          if (mutation.type === "childList") {
            console.log("A child node has been added or removed.");
          } else if (mutation.type === "attributes") {
            console.log(`The ${mutation.attributeName} attribute was modified.`);
          }
        }*/
        //   if no next observer.disconnect();
      })

      const target = document.querySelector("body > div.container.category-child > div > div.products-page__content > div.products-page__list > div.products-list > div")
      if(target===null) {
        alert("Скорее всего Вы должны открыть первую страницу перед нажатием")
        debuggerOrThrow("div.products-list > div Not found")
      }
      observer.observe(target, {childList: true})
      buttonShowMore.click()

      break;
    case "sortLaptops": sortLaptops(sendResponse)
      break;
  }

});
