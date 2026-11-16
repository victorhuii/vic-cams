import {cloudEnabled} from '../lib/storage/cloud';
export function StorageNotice(){return <small className="storage-note">{cloudEnabled?'Photos save automatically to the site owner’s private storage.':'Photos autosave in this tab’s gallery.'}</small>;}
