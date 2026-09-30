import { resources, resourceCategories, findResource } from '../data/resources';
import { rides, studyGroups, eventBuddies } from '../data/connect';
import { forYouSections, mockProfile, onboardingQuestions } from '../data/profile';
import type { Ride } from '../types';

/**
 * Single access layer for screen data.
 *
 * BACKEND PLUG IN POINT: every function here returns mock data today.
 * Swap the bodies for fetch calls (or React Query hooks) that return the same
 * types from src/types, and the pages will not need to change.
 */
export const dataService = {
  getResources: () => resources,
  getResourceCategories: () => resourceCategories,
  getResource: (id: string) => findResource(id),
  getRides: () => rides,
  getStudyGroups: () => studyGroups,
  getEventBuddies: () => eventBuddies,
  getForYouFeed: () => forYouSections,
  getProfile: () => mockProfile,
  getOnboardingQuestions: () => onboardingQuestions,
  // Mock only: no data leaves the browser.
  postRide: (ride: Omit<Ride, 'id'>) => ({ ...ride, id: `local-${Date.now()}` }),
};
