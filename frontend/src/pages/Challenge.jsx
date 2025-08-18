import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { deactivateChallenge } from '../API/apiChallenge';
import toast from 'react-hot-toast';

// Components
import RewardModal from '../components/RewardModal';
import TeacherView from '../components/challenge/TeacherView';
import ChallengeCard from '../components/challenge/cards/ChallengeCard';
import CaesarCipherChallenge from '../components/challenge/cards/CaesarCipherChallenge';
import GitHubOSINTChallenge from '../components/challenge/cards/GitHubOSINTChallenge';
import SecurityBugFixChallenge from '../components/challenge/cards/SecurityBugFixChallenge';
import DigitalForensicsChallenge from '../components/challenge/cards/DigitalForensicsChallenge';
import WayneAWSChallenge from '../components/challenge/cards/WayneAWSChallenge';
import ChallengeConfigModal from '../components/challenge/modals/ChallengeConfigModal';
import DebugPanel from '../components/challenge/modals/DebugPanel';

// Hooks
import { useChallengeData } from '../hooks/useChallengeData';
import { useChallengeConfig } from '../hooks/useChallengeConfig';
import { useTemplates } from '../hooks/useTemplates';

// Utils
import { getThemeClasses } from '../utils/themeUtils';

const Challenge = () => {
  const { classroomId } = useParams();
  const { user, originalUser, setPersona } = useAuth();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  // Custom hooks
  const {
    challengeData,
    setChallengeData,
    userChallenge,
    isTeacher,
    loading,
    classroom,
    showRewardModal,
    setShowRewardModal,
    rewardData,
    fetchChallengeData,
    setDebugProgress
  } = useChallengeData(classroomId);
  
  const {
    challengeConfig,
    setChallengeConfig,
    showConfigModal,
    setShowConfigModal,
    configuring,
    setConfiguring
  } = useChallengeConfig();
  
  const {
    templates,
    showSaveTemplateModal,
    setShowSaveTemplateModal,
    templateName,
    setTemplateName,
    savingTemplate,
    fetchTemplates,
    handleSaveTemplate,
    handleLoadTemplate,
    handleDeleteTemplate
  } = useTemplates();

  // Component state
  const [initiating, setInitiating] = useState(false);
  const [unlockingHint, setUnlockingHint] = useState({});
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [dontShowDeleteWarning, setDontShowDeleteWarning] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [editingHints, setEditingHints] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  
  // Theme classes
  const themeClasses = getThemeClasses(isDark);
  const isTeacherInStudentView = originalUser?.role === 'teacher' && user.role === 'student';

  // Event handlers
  const handleSwitchToTeacher = () => {
    setPersona(originalUser);
  };

  const handleShowConfigModal = () => {
    setShowConfigModal(true);
    fetchTemplates();
  };

  const handleShowDeactivateModal = () => {
    const skipWarning = localStorage.getItem('skipChallengeDeleteWarning') === 'true';
    if (skipWarning) {
      handleConfirmDeactivate();
    } else {
      setShowDeleteWarning(true);
      setDontShowDeleteWarning(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      setInitiating(true);
      const response = await deactivateChallenge(classroomId);
      setChallengeData(null);
      toast.success(response.message);
      setShowDeleteWarning(false);
      if (dontShowDeleteWarning) {
        localStorage.setItem('skipChallengeDeleteWarning', 'true');
      }
      await fetchChallengeData();
    } catch (error) {
      console.error('Error deactivating challenge:', error);
      toast.error(error.message || 'Failed to deactivate challenge');
    } finally {
      setInitiating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  // Teacher view
  if (isTeacher && !isTeacherInStudentView) {
    return (
      <>
        <TeacherView
          challengeData={challengeData}
          setChallengeData={setChallengeData}
          classroom={classroom}
          isDark={isDark}
          handleShowConfigModal={handleShowConfigModal}
          handleShowDeactivateModal={handleShowDeactivateModal}
          initiating={initiating}
        />
        
        <ChallengeConfigModal
          showConfigModal={showConfigModal}
          setShowConfigModal={setShowConfigModal}
          challengeConfig={challengeConfig}
          setChallengeConfig={setChallengeConfig}
          configuring={configuring}
          setConfiguring={setConfiguring}
          fetchChallengeData={fetchChallengeData}
          classroomId={classroomId}
          templates={templates}
          handleLoadTemplate={handleLoadTemplate}
          handleDeleteTemplate={handleDeleteTemplate}
          setShowSaveTemplateModal={setShowSaveTemplateModal}
          setShowHintModal={setShowHintModal}
          setEditingHints={setEditingHints}
        />

        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card bg-base-100 w-full max-w-md mx-4 shadow-xl">
              <div className="card-body">
                <h2 className="text-xl font-bold mb-4">Save Configuration Template</h2>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Template Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    maxLength={100}
                  />
                </div>
                <div className="alert alert-info mb-4">
                  <span className="text-sm">
                    This will save your current configuration including all challenge settings, rewards, and modes.
                  </span>
                </div>
                <div className="card-actions justify-end gap-2">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowSaveTemplateModal(false);
                      setTemplateName('');
                    }}
                    disabled={savingTemplate}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSaveTemplate(challengeConfig)}
                    disabled={savingTemplate || !templateName.trim()}
                  >
                    {savingTemplate ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Template'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteWarning && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card bg-base-100 w-full max-w-md mx-4 shadow-xl">
              <div className="card-body">
                <h2 className="text-xl font-bold text-error mb-4">⚠️ Delete Challenge Series</h2>
                <p className={themeClasses.mutedText}>
                  This will permanently delete all student progress and challenge data from the database. This action cannot be undone.
                </p>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text text-sm">Type "<strong>{classroom?.name} delete</strong>" to confirm:</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`${classroom?.name} delete`}
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={dontShowDeleteWarning}
                      onChange={(e) => setDontShowDeleteWarning(e.target.checked)}
                    />
                    <span className="label-text text-sm">Don't show this warning again</span>
                  </label>
                </div>
                <div className="card-actions justify-end gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowDeleteWarning(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={handleConfirmDeactivate}
                    disabled={confirmText !== `${classroom?.name} delete` || initiating}
                  >
                    {initiating ? <span className="loading loading-spinner loading-xs"></span> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showHintModal && editingHints && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card bg-base-100 w-full max-w-2xl mx-4 shadow-xl">
              <div className="card-body">
                <h2 className="text-xl font-bold mb-4">
                  Configure Hints - {editingHints.challengeName}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Add custom hints that will help students when they're stuck. Hints will be revealed in order.
                </p>
                
                <div className="space-y-3">
                  {Array.from({ length: challengeConfig.maxHintsPerChallenge }, (_, hintIndex) => (
                    <div key={hintIndex}>
                      <label className="label">
                        <span className="label-text font-medium">Hint {hintIndex + 1}</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        placeholder={`Enter hint ${hintIndex + 1}...`}
                        value={challengeConfig.challengeHints[editingHints.challengeIndex]?.[hintIndex] || ''}
                        onChange={(e) => {
                          setChallengeConfig(prev => {
                            const newHints = [...prev.challengeHints];
                            if (!newHints[editingHints.challengeIndex]) {
                              newHints[editingHints.challengeIndex] = [];
                            }
                            newHints[editingHints.challengeIndex][hintIndex] = e.target.value;
                            return { ...prev, challengeHints: newHints };
                          });
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="alert alert-info mt-4">
                  <span className="text-sm">
                    💡 <strong>Tip:</strong> Make hints progressively more specific. Start general, then get more detailed.
                  </span>
                </div>

                <div className="card-actions justify-end gap-2 mt-6">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowHintModal(false);
                      setEditingHints(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowHintModal(false);
                      setEditingHints(null);
                    }}
                  >
                    Save Hints
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Student view
  return (
    <div className="p-6 space-y-8">
      {isTeacherInStudentView && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Teacher Mode</span>
                <button
                  onClick={() => setShowDebugPanel(true)}
                  className="btn btn-sm btn-accent gap-1"
                >
                  🔧 Debug
                </button>
                <button
                  onClick={handleSwitchToTeacher}
                  className="btn btn-sm btn-secondary gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 border border-base-200 shadow-md rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-base-content">Cyber Challenge</h1>
        </div>
        
        {challengeData?.settings?.dueDateEnabled && challengeData?.settings?.dueDate && (
          <div className={`mt-4 p-3 rounded-lg border ${
            new Date() > new Date(challengeData.settings.dueDate) 
              ? isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
              : isDark ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {new Date() > new Date(challengeData.settings.dueDate) ? '⚠️ Past Due:' : '⏰ Due Date:'}
              </span>
              <span>
                {new Date(challengeData.settings.dueDate).toLocaleDateString()} at{' '}
                {new Date(challengeData.settings.dueDate).toLocaleTimeString()}
              </span>
            </div>
            {new Date() > new Date(challengeData.settings.dueDate) && (
              <p className="text-sm mt-1">This challenge has expired and submissions are disabled.</p>
            )}
          </div>
        )}
      </div>

      {!challengeData || !challengeData.isActive ? (
        <div className="card bg-base-100 border border-base-200 shadow-md rounded-2xl p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className={`w-16 h-16 ${isDark ? 'text-base-content/40' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-semibold ${themeClasses.mutedText}`}>No Active Challenge</h2>
            <p className={`${isDark ? 'text-base-content/60' : 'text-gray-500'}`}>
              Your instructor hasn't initiated a cyber challenge yet. Check back later!
            </p>
          </div>
        </div>
      ) : userChallenge ? (
        challengeData?.settings?.dueDateEnabled && 
        challengeData?.settings?.dueDate && 
        new Date() > new Date(challengeData.settings.dueDate) && 
        !isTeacher ? (
          <div className={`card bg-base-100 border ${isDark ? 'border-red-700/50' : 'border-red-200'} shadow-md rounded-2xl p-6 text-center`}>
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl">⏰</div>
              <h2 className="text-2xl font-semibold text-red-600">Challenge Series Expired</h2>
              <p className={`${themeClasses.mutedText} max-w-md`}>
                This challenge series was due on {new Date(challengeData.settings.dueDate).toLocaleDateString()} at{' '}
                {new Date(challengeData.settings.dueDate).toLocaleTimeString()}. 
                You can no longer participate in this challenge.
              </p>
              {userChallenge.progress > 0 && (
                <div className={`mt-4 p-4 ${isDark ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'} rounded-lg`}>
                  <p className={`${isDark ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                    Your Progress: Completed {userChallenge.completedChallenges?.filter(Boolean).length || 0} out of 5 challenges
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          <div className="card bg-base-100 border border-base-200 shadow-md rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">{challengeData?.title || 'Cyber Challenge Series'}</h2>

            
            <ChallengeCard
              challengeIndex={0}
              challengeName="Little Caesar's Secret"
              challengeIcon="🔓"
              challengeDescription="Your mission: decrypt your unique ID to access a password-protected intelligence site."
              userChallenge={userChallenge}
              challengeData={challengeData}
              isDark={isDark}
              unlockingHint={unlockingHint}
              setUnlockingHint={setUnlockingHint}
              fetchChallengeData={fetchChallengeData}
              classroomId={classroomId}
            >
              <CaesarCipherChallenge userChallenge={userChallenge} isDark={isDark} />
            </ChallengeCard>

            <ChallengeCard
              challengeIndex={1}
              challengeName="Check Me Out"
              challengeIcon="🔓"
              challengeDescription="Your mission: Follow the digital trail and find your password to the next challenge."
              userChallenge={userChallenge}
              challengeData={challengeData}
              isDark={isDark}
              unlockingHint={unlockingHint}
              setUnlockingHint={setUnlockingHint}
              fetchChallengeData={fetchChallengeData}
              classroomId={classroomId}
            >
              <GitHubOSINTChallenge userChallenge={userChallenge} isDark={isDark} />
            </ChallengeCard>

            <ChallengeCard
              challengeIndex={2}
              challengeName="Bug Smasher"
              challengeIcon="🐛"
              challengeDescription="Fix a simple security vulnerability in C++ code. Each student gets a unique bug to identify and correct."
              userChallenge={userChallenge}
              challengeData={challengeData}
              isDark={isDark}
              unlockingHint={unlockingHint}
              setUnlockingHint={setUnlockingHint}
              fetchChallengeData={fetchChallengeData}
              classroomId={classroomId}
            >
              <SecurityBugFixChallenge userChallenge={userChallenge} isDark={isDark} />
            </ChallengeCard>

            <ChallengeCard
              challengeIndex={3}
              challengeName="I Always Sign My Work..."
              challengeIcon="🕵️"
              challengeDescription="Your mission: Conduct a digital forensics investigation to extract hidden information from image metadata."
              userChallenge={userChallenge}
              challengeData={challengeData}
              isDark={isDark}
              unlockingHint={unlockingHint}
              setUnlockingHint={setUnlockingHint}
              fetchChallengeData={fetchChallengeData}
              classroomId={classroomId}
            >
              <DigitalForensicsChallenge userChallenge={userChallenge} isDark={isDark} />
            </ChallengeCard>

            <ChallengeCard
              challengeIndex={4}
              challengeName="Secrets in the Clouds"
              challengeIcon="🔐"
              challengeDescription="Your final mission: Authenticate with WayneAWS cloud services using advanced credential verification protocols."
              userChallenge={userChallenge}
              challengeData={challengeData}
              isDark={isDark}
              unlockingHint={unlockingHint}
              setUnlockingHint={setUnlockingHint}
              fetchChallengeData={fetchChallengeData}
              classroomId={classroomId}
            >
              <WayneAWSChallenge userChallenge={userChallenge} isDark={isDark} />
            </ChallengeCard>
          </div>
        </div>
        )
      ) : (
        <div className="card bg-base-100 border border-base-200 shadow-md rounded-2xl p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className="w-16 h-16 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-600">Challenge Not Assigned</h2>
            <p className="text-gray-500">
              You haven't been assigned to this challenge yet. Please contact your instructor.
            </p>
          </div>
        </div>
      )}

      {showRewardModal && rewardData && (
        <RewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          rewards={rewardData.rewards}
          challengeName={rewardData.challengeName}
          allCompleted={rewardData.allCompleted}
          nextChallenge={rewardData.nextChallenge}
        />
      )}

      <DebugPanel
        showDebugPanel={showDebugPanel}
        setShowDebugPanel={setShowDebugPanel}
        userChallenge={userChallenge}
        setDebugProgress={setDebugProgress}
      />
    </div>
  );
};

export default Challenge;
