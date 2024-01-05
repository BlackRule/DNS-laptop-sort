import {Message} from "./types";
import {cpus} from "./cpu_data";

const cpuDataAttribName = 'CPU';
const gpuDataAttribName = 'GPU';


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



function findCPUIndex(name:string) {
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
    throw new Error(`"${name}"`)
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
    throw new Error(`"${name}"`)
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

function compareLaptops(element: Element, element2: Element) {
  let c1 = findCPUIndex((element as HTMLElement).dataset[cpuDataAttribName]!)
  let c2 = findCPUIndex((element2 as HTMLElement).dataset[cpuDataAttribName]!)
  /*if (c2 - c1 > 0) {
        console.log(`swapped ${extractText(element)} and ${extractText(element2)}`)
    }*/
  return c1 - c2 //reversed
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
          throw new Error('FAIL ui-collapse__link-text Модель процессора')
        } else {
          element.style.backgroundColor = 'red'
        }
        const cpuList = ((element.parentNode as ParentNode).parentNode as ParentNode).querySelector<HTMLDivElement>('.ui-checkbox-group_list')

        if (cpuList === null) {
          console.dir(element)
          throw new Error('FAIL parent')
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
      if(buttonShowMore===null) throw Error("buttonShowMore")
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
        throw Error("div.products-list > div Not found")
      }
      observer.observe(target, {childList: true})
      buttonShowMore.click()

      break;
    case "sortLaptops": {
      let success = true
      try {
        const selector = '.catalog-products.view-simple';
        let laptopsParent: HTMLSpanElement | null = document.querySelector(selector)
        if (laptopsParent === null) {
          throw new Error(`FAIL ${selector}`)
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
        //assign data attributes to laptops
        for (let i = 0; i < laptopsParent.childElementCount; i++) {
          const laptop=laptopsParent.children[i] as HTMLDivElement
          let text=(laptop.children[1]!/*a.catalog-product__name.ui-link.ui-link_black*/.
            firstChild! as HTMLSpanElement)/*span*/.innerText
          const match = text.match(/([\d.]+)"[^\[]+\[(?:английская раскладка, )?([^,]+), ([^,]+), ([^,]+)(?:, ([^,]+))?, RAM (\d+) ГБ, ([^,]+), ([^,]+), ([^\]]+)]/)
          if(match===null||match.length<10||match[4]==='TN+film') debugger//throw Error()
          else {
            const [_, screenDiag, screenResolution, screenTech, cpu, cpuCores, ramN, storage, gpu, os] = match
            laptop.dataset[cpuDataAttribName] = cpu
            laptop.dataset[gpuDataAttribName] = gpu
          }
        }
        console.log(`done assign data attributes to laptops`)

        bubbleSort(laptopsParent, compareLaptops)
        console.log(`done bubbleSort(laptopsParent, compareLaptops)`)

      } catch (e) {
        console.log(e)
        success = false
      } finally {
        sendResponse("done");
        if (success) console.log("sort laptops DONE")
      }
    }
      break;
  }

});
