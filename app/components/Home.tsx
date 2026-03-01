/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const { ipcRenderer } = require('electron');

export default function Home(): JSX.Element {
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [outputPath, setOutputPath] = useState('');
  const [browserPath, setBrowserPath] = useState('');
  const [currentRegion, setCurrentRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [customQuery, setCustomQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

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
      const { locations: locationsArray, browser } = arg;
      setTags(tagsArray);
      setTag(tagsArray[0].value)
      setRegions(regionArray);
      setLocations(locationsArray);
      setBrowserPath(browser);
      ipcRenderer.removeAllListeners('init-reply');
    });

    ipcRenderer.on('set-path-reply', (_event, arg) => {
      if(arg) setOutputPath(arg);
    })

    ipcRenderer.on('set-browser-path-reply', (_event, arg) => {
      if(arg) setBrowserPath(arg);
    })

    ipcRenderer.on('scrape-stop', () => {
      setIsScraping(false);
    })

    ipcRenderer.on('logger', (_event, arg) => {
      setLogs(logs => [arg.message, ...logs]);
    })
  }, []);

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
    if(!currentLocation || outputPath.length === 0){
      setBtnDisabled(true)
    }

    if(currentLocation && outputPath.length > 0){
      setBtnDisabled(false)
    }

    if(customQuery.length > 0 && outputPath.length > 0){
      setBtnDisabled(false)
    }
  }, [currentLocation, outputPath, customQuery]);

  const startScraping = (e) => {
    e.preventDefault();
    setIsScraping(!isScraping);
    if(!isScraping){
      setLogs([]);
      ipcRenderer.send('scrape-start', { location: currentLocation, tag, custom: customQuery });
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
      <h2>Colombo</h2>
      <div className="mb-3">
        <button type="button" disabled={isScraping} className="btn btn-sm btn-outline mr-3" onClick={(e) => onSetOutputPath(e)}>
          Choose Destination
        </button>
        <span className="file-path">{ outputPath }</span>
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
    </div>
  );
}
