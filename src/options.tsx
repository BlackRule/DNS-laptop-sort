import React, {useEffect, useRef, useState} from "react";
import { createRoot } from "react-dom/client";
import {gpuScores} from "./gpu_data";
import {cpuScores} from "./cpu_data";
import {Scores} from "./types";

const Options = () => {
  const [color, setColor] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [like, setLike] = useState<boolean>(false);

  useEffect(() => {
    // Restores select box and checkbox state using the preferences
    // stored in chrome.storage.
    chrome.storage.sync.get(
      {
        favoriteColor: "red",
        likesColor: true,
      },
      (items) => {
        setColor(items.favoriteColor);
        setLike(items.likesColor);
      }
    );
  }, []);

  const saveOptions = () => {
    // Saves options to chrome.storage.sync.
    chrome.storage.sync.set(
      {
        favoriteColor: color,
        likesColor: like,
      },
      () => {
        // Update status to let user know options were saved.
        setStatus("Options saved.");
        const id = setTimeout(() => {
          setStatus("");
        }, 1000);
        return () => clearTimeout(id);
      }
    );
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getNorm=(what:Scores) => {
    if (textareaRef.current === null) return
    const res={}
    const keys=Object.keys(what)
    let max_score=what[keys[0]]
    let min_score=what[keys[0]]
    for (const key of keys) {
      if(what[key]<min_score) min_score= what[key]
      if(what[key]>max_score) max_score= what[key]
    }
    for (const key of keys) {
      res[key] = (what[key] - min_score) / (max_score - min_score)
    }
    textareaRef.current.value=JSON.stringify(res)
  }

  return (
    <>
      <div>
        Favorite color: <select
        value={color}
        onChange={(event) => setColor(event.target.value)}
      >
        <option value="red">red</option>
        <option value="green">green</option>
        <option value="blue">blue</option>
        <option value="yellow">yellow</option>
      </select>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={like}
            onChange={(event) => setLike(event.target.checked)}
          />
          I like colors.
        </label>
      </div>
      <div>{status}</div>
      <button onClick={saveOptions}>Save</button>
      <textarea ref={textareaRef} style={{minWidth: '1024px', minHeight: '350px'}}/>
      <button onClick={() => {
        if (textareaRef.current === null) return
        let str = textareaRef.current.value
        str = str.replace(/(.*)\n.*\n(.*)\n.*(\n?)/g, '$1\t$2$3')
        str = str.replace(/,/g, '_')
        str = str.replace(/ @ [\d.]+[GM]Hz/g, '')
        // str=str.replace(/(.*)\n([\d,]+)/g,'$1\t$2\n') //Реклама
        alert('Не забудь убрать рекламу!')
        textareaRef.current.value = str
      }}>cleanup
      </button>
      <button onClick={() => {
        if (textareaRef.current === null) return
        let str = textareaRef.current.value
        str = str.replace(/(.*)\t.*(\n?)/g, '"$1",$2')
        textareaRef.current.value = str
      }}>to json string[]
      </button>
      <button onClick={() => {
        if (textareaRef.current === null) return
        let str = textareaRef.current.value
        str = str.replace(/(.*)\t(.*)(\n?)/g, '"$1":$2,$3')
        textareaRef.current.value = str
      }}>to json {'{'} [model: string]: number {'}'}</button>
      <button onClick={() =>getNorm(gpuScores)}>get normalised (on [0..1]) GPU data
      </button>
      <button onClick={() =>getNorm(cpuScores)}>get normalised (on [0..1]) CPU data
      </button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options/>
  </React.StrictMode>
);
