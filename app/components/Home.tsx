/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import iconImage from '../../resources/icon.png';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

type Option = {
  value: string;
  label: string;
};

type LocationsRow = Record<string, string>;

export default function Home(): JSX.Element {
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<Option[]>([]);
  const [locations, setLocations] = useState<LocationsRow[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Option[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [outputPath, setOutputPath] = useState('');
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [serperKey, setSerperKey] = useState('');
  const [browserPath, setBrowserPath] = useState('');
  const hasBrowserPath = browserPath.trim().length > 0;

  useEffect(() => {
    const loadInitialData = async () => {
      const response = await fetch(`${API_BASE}/init`);
      const data = await response.json();

      const regionArray = data.regions.sort().map((r: string) => {
        return {
          value: r,
          label: r,
        };
      });

      const tagsArray = data.tags.map((t: string) => {
        return {
          value: t,
          label: t,
        };
      });

      const { locations: locationsArray } = data;
      setTags(tagsArray);
      if (tagsArray.length > 0) {
        setTag(tagsArray[0].value);
      }
      setRegions(regionArray);
      setLocations(locationsArray);
    };

    loadInitialData().catch((error) => {
      setLogs((prevLogs) => [
        `ERROR: Failed loading CSV data: ${error.message || error}`,
        ...prevLogs,
      ]);
    });
  }, []);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();

        setIsScraping(Boolean(data.isScraping));
        if (Array.isArray(data.logs)) setLogs(data.logs);

        if (data.settings) {
          if (typeof data.settings.outputPath === 'string') {
            setOutputPath(data.settings.outputPath);
          }
          if (typeof data.settings.browserPath === 'string') {
            setBrowserPath(data.settings.browserPath);
          }
          if (typeof data.settings.serperKey === 'string') {
            setSerperKey(data.settings.serperKey);
            try {
              window.localStorage.setItem('serperKey', data.settings.serperKey);
            } catch (_error) {
              // ignore local storage failures
            }
          }
        }

        if (data.lastError) {
          setLogs((prevLogs) => [`ERROR: ${data.lastError}`, ...prevLogs]);
        }
      } catch (_error) {
        // ignore transient polling errors
      }
    };

    pollStatus();
    const timer = window.setInterval(pollStatus, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const openKeyModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowKeyModal(true);
  };

  const closeKeyModal = () => {
    setShowKeyModal(false);
  };

  const saveSerperKey = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const trimmedKey = serperKey.trim();
    setSerperKey(trimmedKey);
    try {
      window.localStorage.setItem('serperKey', trimmedKey);
    } catch (_err) {
      // ignore local storage failures
    }

    fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serperKey: trimmedKey }),
    });

    setShowKeyModal(false);
  };

  const filterLocations = (e: Option) => {
    setCurrentRegion(e.value);
    setCurrentLocation(null);

    let currentLocations: string[] = [];
    locations
      .filter((l) => {
        return Object.keys(l)[0] === e.value;
      })
      .map((f) => currentLocations.push(f[Object.keys(f)[0]]));

    const mappedLocations = currentLocations.sort().map((f) => {
      return {
        value: f,
        label: f,
      };
    });

    setFilteredLocations(mappedLocations);
  };

  const updateLocation = (e: Option | null) => {
    if (e && e.value) {
      setCurrentLocation(e.value);
    } else {
      setCurrentLocation(null);
    }
  };

  const updateTag = (e: Option | null) => {
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

  const startScraping = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsScraping(!isScraping);
    if(!isScraping){
      setLogs([]);
      fetch(`${API_BASE}/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: currentLocation, tag, custom: customQuery, serperKey }),
      }).catch((error) => {
        setLogs((prevLogs) => [`ERROR: ${error.message || error}`, ...prevLogs]);
        setIsScraping(false);
      });
    } else{
      fetch(`${API_BASE}/scrape/stop`, { method: 'POST' });
    }
  };

  const onSetOutputPath = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const value = window.prompt('Insert output folder path', outputPath || '');
    if (value && value.trim()) {
      const trimmedValue = value.trim();
      setOutputPath(trimmedValue);
      fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputPath: trimmedValue }),
      });
    }
  };

  const onSetBrowserPath = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const value = window.prompt('Insert Chrome executable path', browserPath || '');
    if (value && value.trim()) {
      const trimmedValue = value.trim();
      setBrowserPath(trimmedValue);
      fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browserPath: trimmedValue }),
      });
    }
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
