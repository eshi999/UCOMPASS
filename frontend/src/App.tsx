import { useState } from 'react';
import type { Ride, StudentProfile, TabId } from './types';
import { AppShell, BottomNav } from './components/AppShell';
import { AppProvider, useApp } from './components/AppContext';
import { TalkPage } from './pages/TalkPage';
import { ForYouPage } from './pages/ForYouPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ResourceDetailSheet } from './pages/ResourceDetailSheet';
import { ConnectPage } from './pages/ConnectPage';
import { CreateRidePage } from './pages/CreateRidePage';
import { ProfilePage } from './pages/ProfilePage';
import { OnboardingPage, type OnboardingAnswers } from './pages/OnboardingPage';
import { dataService } from './services/dataService';

// Demo helpers: ?tab=connect jumps to a tab, ?intro=1 shows onboarding first,
// ?ask=... opens Talk with that question already sent.
const params = new URLSearchParams(window.location.search);
const tabIds: TabId[] = ['talk', 'foryou', 'resources', 'connect', 'you'];
const initialTab = (tabIds.includes(params.get('tab') as TabId) ? params.get('tab') : 'talk') as TabId;

function profileFromAnswers(a: OnboardingAnswers, base: StudentProfile): StudentProfile {
  const transport = a.transport ?? [];
  return {
    ...base,
    studentType: a.type?.[0] ?? base.studentType,
    descriptors: a.describe?.length ? a.describe : base.descriptors,
    interests: a.interests?.length ? a.interests : base.interests,
    transportation: transport.length ? (transport.includes('Car') ? transport.join(' / ') : `No car / ${transport.join(' / ')}`) : base.transportation,
    goals: a.goals?.length ? a.goals : base.goals,
  };
}

function Screens() {
  const { toast } = useApp();
  const [onboarding, setOnboarding] = useState(params.get('intro') === '1');
  const [tab, setTab] = useState<TabId>(initialTab);
  const [creatingRide, setCreatingRide] = useState(params.get('screen') === 'create-ride');
  const [postedRides, setPostedRides] = useState<Ride[]>([]);
  const [profile, setProfile] = useState<StudentProfile>(dataService.getProfile());

  if (onboarding) {
    return (
      <OnboardingPage
        onSkip={() => setOnboarding(false)}
        onDone={(a) => {
          setProfile(profileFromAnswers(a, profile));
          setOnboarding(false);
          setTab('foryou');
          toast('All set. Your feed is ready.');
        }}
      />
    );
  }

  if (creatingRide) {
    return (
      <CreateRidePage
        onBack={() => setCreatingRide(false)}
        onPost={(r) => {
          setPostedRides((p) => [dataService.postRide(r), ...p]);
          setCreatingRide(false);
          setTab('connect');
          toast('Ride posted (demo)');
        }}
      />
    );
  }

  return (
    <>
      {/* Talk stays mounted so the conversation survives tab switches. */}
      <div className="tab-view" hidden={tab !== 'talk'}>
        <TalkPage profileName={profile.name} initialAsk={params.get('ask') ?? undefined} />
      </div>
      <div className="tab-view" key={tab} hidden={tab === 'talk'}>
        {tab === 'foryou' && <ForYouPage profile={profile} />}
        {tab === 'resources' && <ResourcesPage />}
        {tab === 'connect' && <ConnectPage onOfferRide={() => setCreatingRide(true)} postedRides={postedRides} />}
        {tab === 'you' && <ProfilePage profile={profile} onRestartOnboarding={() => setOnboarding(true)} />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
      <ResourceDetailSheet />
    </>
  );
}

export default function App() {
  return (
    <AppShell>
      <AppProvider>
        <Screens />
      </AppProvider>
    </AppShell>
  );
}
