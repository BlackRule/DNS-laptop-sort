import {Message} from "./types";
import {cpus} from "./data";

//returns fn that executes f only if f wasn't invoked for delay
function debounce(f:(...args)=>void,delay:number){
  let timeout:null|number=null
  return (...args)=>{
    if(timeout!=null) clearTimeout(timeout)
    timeout=setTimeout(()=>f(...args),delay)
  }
}

function extractText(element: Element) {
  if (element.firstElementChild?.firstChild?.nodeType !== Node.TEXT_NODE) return ''
  // @ts-ignore
  return (element.firstElementChild.firstChild.wholeText as string).trim()
}

function findIndex(element: Element) {
  let t = extractText(element)
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
    t = t.replace(replacement[0], replacement[1])
  }
  let idx = cpus.lastIndexOf(t)
  if (idx === -1) {
    throw new Error(`"${t}"`)
  }
  return idx
}

function compare(element: Element, element2: Element) {
  let c1 = findIndex(element)
  let c2 = findIndex(element2)
  /*if (c2 - c1 > 0) {
        console.log(`swapped ${extractText(element)} and ${extractText(element2)}`)
    }*/
  return c1 - c2 //reversed
}

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
  switch (msg) {
    case "sortCPUs": //TODO make work with expanded Модель процессора as well
      // use mutation observer for that
      // `as HTMLSpanElement | null` is a fix to TS bug "Variable is of type 'never' after potential assignment in a forEach lambda"
      let success = false
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
        let swapped = true

        for (let i = 0; i < cpuList.childElementCount; i++) {
          if (cpuList.children[i].firstElementChild?.querySelectorAll('.catalog-filter-count').length === 0) {
            cpuList.children[i].remove()
            i--
            continue
          }
          try {
            findIndex(cpuList.children[i])
          } catch (e) {
            console.log(extractText(cpuList.children[i]))
            swapped = false
            success = false
          }
        }
        while (swapped) {
          swapped = false
          for (let i = 0; i < cpuList.childElementCount - 1; i++) {
            if (compare(cpuList.children[i], cpuList.children[i + 1]) > 0) {
              cpuList.insertBefore(cpuList.children[i + 1], cpuList.children[i])
              swapped = true
            }
          }
        }
        success = true
      } catch (e) {
        console.log(e)
      } finally {
        sendResponse("done");
        if (element === null) return
        if (success) element.style.backgroundColor = 'green'
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
  }

});
