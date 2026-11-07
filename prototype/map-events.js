import {personalEventsAt} from './personal-events.js';
import {fortnightActivityView} from './fortnight-life.js';
import {communityActivityDefinitions,activityAvailability} from './community-activities.js';
import {neighborhoodEventsAt} from './neighborhood-events.js';
export function mapEventsAt(s,place){if(s.academics?.registrationPending||s.freeDay?.home)return [];const out=personalEventsAt(s,place).map(e=>({id:e.person,title:e.title,kind:'personal'}));out.push(...neighborhoodEventsAt(s,place).map(e=>({id:e.id,title:e.title,kind:'neighborhood'})));const daily=fortnightActivityView({...s,location:place});if(daily)out.push({id:`daily:${s.day}`,title:daily.title,kind:'daily'});for(const [id,d] of Object.entries(communityActivityDefinitions)){if(d.venue.location!==place||!s.flow?.postsRead?.[id]&&!s.flow?.activitiesHeard?.[id])continue;if(activityAvailability(s,id).ok)out.push({id,title:d.title,kind:'public'});}return out;}
