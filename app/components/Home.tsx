/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import iconImage from '../../resources/icon.png';

const { ipcRenderer } = require('electron');

export default function Home(): JSX.Element {
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [outputPath, setOutputPath] = useState('');
  const [currentRegion, setCurrentRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [customQuery, setCustomQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [serperKey, setSerperKey] = useState('');
  const [browserPath, setBrowserPath] = useState('');
  const hasSerperKey = serperKey.trim().length > 0;
  const hasBrowserPath = browserPath.trim().length > 0;

  if (tags.length === 0 || regions.length === 0) {
    ipcRenderer.send('init');
  }

  // Add events listeners
  useEffect(() => {
    // Populate location select inputs
    ipcRenderer.on('init-reply', (_event, arg) => {
      const regionArray = arg.regions.sort().map((r) => {
        return {
          value: r,
          label: r,
        };
      });
      const tagsArray = arg.tags.map((t) => {
        return {
          value: t,
          label: t,
        };
      });
      const { locations: locationsArray } = arg;
      setTags(tagsArray);
      setTag(tagsArray[0].value)
      setRegions(regionArray);
      setLocations(locationsArray);
      ipcRenderer.removeAllListeners('init-reply');
    });

    // load serper key from main if not present in localStorage
    const localKey = window.localStorage.getItem('serperKey');
    if (localKey) setSerperKey(localKey);
    else {
      ipcRenderer.send('get-serper-key');
      ipcRenderer.on('get-serper-key-reply', (_e, key) => {
        if (key) {
          setSerperKey(key);
          try { window.localStorage.setItem('serperKey', key); } catch (e) {}
        }
        ipcRenderer.removeAllListeners('get-serper-key-reply');
      });
    }

    ipcRenderer.on('set-path-reply', (_event, arg) => {
      if(arg) setOutputPath(arg);
    })

    ipcRenderer.on('set-browser-path-reply', (_event, arg) => {
      if(arg) setBrowserPath(arg);
    })

    ipcRenderer.on('get-browser-path-reply', (_event, arg) => {
      if(arg) setBrowserPath(arg);
    })

    ipcRenderer.on('scrape-stop', () => {
      setIsScraping(false);
    })

    // Request browser path on mount
    ipcRenderer.send('get-browser-path');

    ipcRenderer.on('scrape-error', (_event, arg) => {
      setIsScraping(false);
      setLogs(logs => [`ERROR: ${arg.message}`, ...logs]);
    })

    ipcRenderer.on('logger', (_event, arg) => {
      setLogs(logs => [arg.message, ...logs]);
    })
  }, []);

  const openKeyModal = (e) => {
    e.preventDefault();
    setShowKeyModal(true);
  };

  const closeKeyModal = () => {
    setShowKeyModal(false);
  };

  const saveSerperKey = (e) => {
    e.preventDefault();
    const trimmedKey = serperKey.trim();
    setSerperKey(trimmedKey);
    try { window.localStorage.setItem('serperKey', trimmedKey); } catch (err) {}
    ipcRenderer.send('set-serper-key', trimmedKey);
    setShowKeyModal(false);
  };

  const filterLocations = (e) => {
    setCurrentRegion(e.value);
    setCurrentLocation(null);

    let currentLocations: any = [];
    locations
      .filter((l) => {
        return Object.keys(l)[0] === e.value;
      })
      .map((f) => currentLocations.push(f[Object.keys(f)[0]]));

    currentLocations = currentLocations.sort().map((f) => {
      return {
        value: f,
        label: f,
      };
    });

    setFilteredLocations(currentLocations);
  };

  const updateLocation = (e) => {
    if (e && e.value) {
      setCurrentLocation(e.value);
    } else {
      setCurrentLocation(null);
    }
  };

  const updateTag = (e) => {
    if (e && e.value) {
      setTag(e.value);
    } else {
      setTag('');
    }
  };

  // check button enabled
  useEffect(() => {
    if(!currentLocation || outputPath.length === 0 || !hasBrowserPath){
      setBtnDisabled(true)
    }

    if(currentLocation && outputPath.length > 0 && hasBrowserPath){
      setBtnDisabled(false)
    }

    if(customQuery.length > 0 && outputPath.length > 0 && hasBrowserPath){
      setBtnDisabled(false)
    }
  }, [currentLocation, outputPath, customQuery, hasBrowserPath]);

  const startScraping = (e) => {
    e.preventDefault();
    setIsScraping(!isScraping);
    if(!isScraping){
      setLogs([]);
      ipcRenderer.send('scrape-start', { location: currentLocation, tag, custom: customQuery, serperKey });
    } else{
      ipcRenderer.send('scrape-stop');
    }
  };

  const onSetOutputPath = (e) => {
    e.preventDefault();
    ipcRenderer.send('set-path');
  };

  const onSetBrowserPath = (e) => {
    e.preventDefault();
    ipcRenderer.send('set-browser-path');
  };


  return (
    <div className="container">
      <div style={{ backgroundColor: '#29040a', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <img src={iconImage} alt="Colombo Icon" style={{ height: '40px', marginRight: '12px' }} />
        <h2 style={{ margin: 0, color: 'white' }}>Colombo</h2>
      </div>
      <div className="mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {!hasBrowserPath && (
            <span
              style={{
                display: 'inline-block',
                marginRight: 8,
                padding: '3px 8px',
                border: '1px solid #f39c12',
                borderRadius: 4,
                color: '#f39c12',
                fontSize: 12,
              }}
            >
              Chrome not configured
            </span>
          )}
          <button
            type="button"
            disabled={isScraping}
            className="btn btn-sm btn-outline mr-3"
            onClick={(e) => onSetBrowserPath(e)}
          >
            Set Chrome Browser
          </button>
          {hasBrowserPath && (
            <span className="file-path" style={{ fontSize: '11px', color: '#888', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              { browserPath }
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ border: '1px solid #555', color: '#555', background: 'transparent', marginLeft: 'auto' }}
            onClick={(e) => openKeyModal(e)}
          >
            ⚙ Advanced
          </button>
        </div>
      </div>
      <div>
        <div style={{ minWidth: 0 }}>
          <button type="button" disabled={isScraping} className="btn btn-sm btn-outline mr-3" onClick={(e) => onSetOutputPath(e)}>
            Choose Destination
          </button>
          <span className="file-path" style={{ fontSize: '11px', color: '#888', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              { outputPath }
            </span>
        </div>
      </div>
      <hr />
      <div className="form-group">
        <h4 className="label mt-0 mb-2">Region</h4>
        <Select
          options={regions}
          onChange={filterLocations}
          className="mb-3"
          isDisabled={customQuery.length > 0}
        />
      </div>
      <div className="form-group">
        <h4 className="label mt-0 mb-2">City</h4>
        <Select
          value={{ label: currentLocation }}
          options={filteredLocations}
          onChange={updateLocation}
          isClearable
          isDisabled={!currentRegion || customQuery.length > 0}
          className="mb-3"
        />
      </div>
      <div className="form-group">
        <h4 className="label mt-0 mb-2">Starting Tag</h4>
        <Select
          name="tag"
          value={{ label: tag }}
          options={tags}
          onChange={updateTag}
          className="mb-3"
          isDisabled={customQuery.length > 0}
        />
      </div>
      <hr />
      <div className="mb-3">
        <label htmlFor="custom-query">
          Custom Query
          <input type="text" name="custom-query" className="form-control" placeholder="Custom query..." onChange={e => setCustomQuery(e.target.value)} />
        </label>
      </div>
      <div className="logger mb-4">
        <pre>{ logs.join('\n') }</pre>
      </div>
      <div className="text-right">
        <button
          type="button"
          disabled={btnDisabled}
          className={isScraping ? 'btn btn-secondary' : 'btn btn-primary'}
          onClick={(e) => startScraping(e)}
        >
          {isScraping ? 'Stop' : 'Start'}
        </button>
      </div>

      {showKeyModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div style={{ width: 480, margin: '8% auto', background: '#fff', padding: 20, borderRadius: 6 }}>
            <h4>Set Serper.dev API Key</h4>
            <p style={{ marginTop: 8 }}>
              <input type="password" className="form-control" value={serperKey} onChange={e => setSerperKey(e.target.value)} placeholder="Paste your Serper.dev key here" />
            </p>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button className="btn btn-sm btn-outline mr-2" onClick={closeKeyModal}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={saveSerperKey}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
