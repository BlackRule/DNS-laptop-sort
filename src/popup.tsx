import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {Message} from "./types";

const sortCPUs = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(
          tab.id,
          "sortCPUs" as Message,
          (msg) => {
            console.log("result message:", msg);
          }
      );
    }
  });
}
const autoShowMore = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        "autoShowMore" as Message,
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
      <button onClick={sortCPUs} style={{width:"max-content"}}>Sort CPUs</button>
      <button onClick={autoShowMore} style={{width:"max-content"}}>autoShowMore</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
