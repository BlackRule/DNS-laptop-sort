import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {Message} from "./types";

const action = (m:Message) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(
          tab.id,
        m,
          (msg) => {
            console.log("result message:", msg);
          }
      );
    }
  });
}


const Popup = () => {
  return (
    <>
      <button onClick={()=>action('sortCPUs')} style={{width:"max-content"}}>Sort CPUs</button>
      <button onClick={()=>action('autoShowMore')} style={{width:"max-content"}}>autoShowMore</button>
      <button onClick={()=>action('sortLaptops')} style={{width:"max-content"}}>sortLaptops</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
