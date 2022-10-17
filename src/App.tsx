import React, { useEffect, useState } from 'react';

import './App.css';

interface Event {
  timestamp: string
  text: string 
}

enum Mode {
  editor='editor',
  vertical=   'vertical' ,
  horizontal=    'horizontal',
}
interface State {
  duration: string
  events: Event[]
  mode:Mode
}

function pushState(state: State) {
  const searchParams = new URLSearchParams()

  searchParams.append('mode', state.mode.toString())
  searchParams.append('duration', state.duration.toString())

  state.events.forEach(evt => {
    searchParams.append('e', `${evt.timestamp}:${evt.text}`)
  })

  const query =  searchParams.toString()

  window.history.replaceState(null, '', '?' + query);
  window.dispatchEvent(new Event('locationchange'));
}

function readState(): State {
  const urlParams = new URLSearchParams(window.location.search)

  const events = urlParams.getAll('e')
    .map(text => text.split(':'))
    .map(([timestamp, text]) => ({timestamp, text}))
    .sort((a,b) => parseInt(a.timestamp)-parseInt(b.timestamp))
  
  const mode = urlParams.get('mode') ?? '';
  return {
    duration: urlParams.get('duration') ?? '',
    events,
    mode: Object.keys(Mode).includes(mode) ? mode as Mode : Mode.editor
  }
}

function printTime(timestamp: string | number)  {
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const minutes = Math.floor(time/60);
  const seconds = ((time%60)+'').padStart(2, '0')
  return `${minutes}:${seconds}`
}

function App() {
  const [state, stateSetter] = useState(readState())

  const doChange = (stateChanges: Partial<State>) => {
    const newState = {...state, ...stateChanges};
    pushState(newState)
  }

  useEffect(() => {
    // browser navigation used
    const handler = () => {
      const state = readState();
      stateSetter(state);
    };


    window.addEventListener('popstate', handler);
    window.addEventListener('locationchange', handler);

    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('locationchange', handler);
    };
  }, []);

  return <div className="App">
    <div>
      <button onClick={() => doChange({mode: Mode.editor})}>Editor</button>
      |
      <button onClick={() => doChange({mode: Mode.horizontal})}>Horizontal</button>
      |
      <button onClick={() => doChange({mode: Mode.vertical})}>Vertical</button>
    </div>
    {state.mode === Mode.editor ? <Editor state={state} /> : undefined}
    {state.mode === Mode.horizontal ? <Horizontal state={state} /> : undefined}
    {state.mode === Mode.vertical ? <Vertical state={state} /> : undefined}
  </div>
}

function calcLeft(timestamp: string | number, time: number) {
  const t = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const left = (t / time) * 100;
  return `${left}%`;
}

function calcLeftMs(timestamp: string | number, time: number) {
  const t = (typeof timestamp === 'string' ? parseInt(timestamp) : timestamp) / 1000;
  const left = (t / time) * 100;
  return `${left}%`;
}

function calcTop(timestamp: string | number, time: number) {
  const t = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const top = (t / time) * 100;
  return `${top}%`;
}

function calcTopMs(timestamp: string | number, time: number) {
  const t = (typeof timestamp === 'string' ? parseInt(timestamp) : timestamp) / 1000;
  const top = (t / time) * 100;
  return `${top}%`;
}

function Horizontal({state}:{state: State}) {
  const {duration, events} = state;
  const [playing, playingSetter] = useState(false);
  const [currentTimestampMs, currentTimestampMsSetter] = useState(0);
  const currentTimestamp = Math.floor(currentTimestampMs/1000);
  const time = parseInt(duration);

  useEffect(() => {
    if (playing) {
      const handle = setInterval(() => {
        currentTimestampMsSetter(p => p+250);
      }, 250);
      return () => clearInterval(handle);
    }
  }, [playing]);

  return <div >
 <div className="timeline">
  {events.map((evt, i) => <div key={evt.timestamp+evt.text+i} className="event" style={{left: calcLeft(evt.timestamp, time)}}>
      {evt.text}
    </div>)}
    <hr className="bar"/>
    <hr className="pos" style={{left: calcLeftMs(currentTimestampMs, time)}} />
    
  </div>

  <div>
    {playing ? <button onClick={e => playingSetter(!playing)} >⏸️</button> :
    <button onClick={() => playingSetter(!playing)} >⏯</button>}
    {' '}{printTime(currentTimestamp)}
    <button onClick={() => {currentTimestampMsSetter(0); playingSetter(false)}} >Reset</button>
  </div>
  </div>
}

function Vertical({state}:{state: State}) {
  const {duration, events} = state;
  const [playing, playingSetter] = useState(false);
  const [currentTimestampMs, currentTimestampMsSetter] = useState(0);
  const currentTimestamp = Math.floor(currentTimestampMs/1000);
  const time = parseInt(duration);

  useEffect(() => {
    if (playing) {
      const handle = setInterval(() => {
        currentTimestampMsSetter(p => p+250);
      }, 250);
      return () => clearInterval(handle);
    }
  }, [playing]);

  return <div >
 <div className="timeline-v">
  {events.map((evt, i) => <div key={evt.timestamp+evt.text+i} className="event" style={{top: calcTop(evt.timestamp, time)}}>
      {evt.text}
    </div>)}
    <hr className="bar"/>
    <hr className="pos" style={{top: calcTopMs(currentTimestampMs, time)}} />
    <div className="time" style={{top: calcTopMs(currentTimestampMs, time)}} >{printTime(currentTimestamp)}</div>
    
  </div>

  <div className='controls'>
    {playing ? <button onClick={e => playingSetter(!playing)} >⏸️</button> :
    <button onClick={() => playingSetter(!playing)} >⏯</button>}
    {' '}{printTime(currentTimestamp)}
    <button onClick={() => {currentTimestampMsSetter(0); playingSetter(false)}} >Reset</button>
  </div>
  </div>
}

function Editor({state}:{state: State}) {
  const {events} = state;
 
  
  const doChange = (stateChanges: Partial<State>) => {
    const newState = {...state, ...stateChanges};
    pushState(newState)
  }
  
  const addRow = () => {
    const timestamp = events.length === 0 ? '1' : ''+(parseInt(events[events.length-1].timestamp)+1)
    doChange({events: [...events, {timestamp, text: ''}]});
  }

  function isDefined<T>(val: T | undefined): val is T {
    return val !== undefined;
  }

  const updateRow = (oldTimestamp: string, newValues: Event | undefined) => {
    const updatedEvents = events.map(evt => {
      if (evt.timestamp === oldTimestamp) {
        return newValues
      } else {
        return evt;
      }
    }).filter(isDefined);
    doChange({events:updatedEvents});
  }



  return (
    <div className="App">
      <div>
        Duration
        <input type="number" value={state.duration} onChange={e => doChange({duration: e.target.value})}/>
        {printTime(state.duration)}
      </div>

      <div>
        {events.map((evt, i) => <div key={evt.timestamp+evt.text+i}>
          <Row evt={evt} updateRow={updateRow} />
        </div>)}
        <button onClick={() => addRow()}>+</button>
      </div>

      <Horizontal state={state} />
     
      <div>
      {events.map((evt, i) => <div key={evt.timestamp+evt.text+i}>
          {printTime(evt.timestamp)}:{evt.text}
        </div>)}
      </div>
    </div>
  );
}



function Row({evt, updateRow}: {evt: Event, updateRow: (oldTimestamp: string, evt: Event | undefined) => void}) {
  const [timestamp, timestampSetter] = useState(evt.timestamp);
  const [text, textSetter] = useState(evt.text);
  const changed = timestamp !== evt.timestamp || text !== evt.text;

  return <div>
    <input placeholder='time' value={timestamp} onChange={e => timestampSetter(e.target.value)} />
    {printTime(timestamp)}
    <input placeholder='text' value={text} onChange={e => textSetter(e.target.value)}/>
    <button disabled={!changed} onClick={() => updateRow(evt.timestamp, {timestamp, text})}>save</button>
    <button disabled={!changed} onClick={() => {timestampSetter(evt.timestamp); textSetter(evt.text)}} >cancel</button>
    <button onClick={() => updateRow(evt.timestamp, undefined)}>remove</button>
  </div>
}


export default App;
