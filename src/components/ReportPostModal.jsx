import { useState } from 'react';
import Card from './Card';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ReportPostModal = ({ isOpen, onClose, postId, postContent }) => {
  const [reason, setReason] = useState('fake');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fakeProbability, setFakeProbability] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (!isOpen) return null;
  
  const handleReport = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to report post');
      }
      
      alert('Post reported successfully');
      onClose();
    } catch (error) {
      console.error('Error reporting post:', error);
      alert(error.message || 'Failed to report post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const analyzeWithGrok = async () => {
    if (!postContent || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/ai/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this social media post for potential misinformation or fake news. Rate it on a scale of 1-10, where 10 is definitely fake news and 1 is highly credible. Explain your reasoning briefly. Here's the post: "${postContent}"`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze post');
      }
      
      const data = await response.json();
      setFakeProbability(data.answer);
    } catch (error) {
      console.error('Error analyzing with Grok:', error);
      setFakeProbability('Unable to analyze content. Please submit your report based on your own assessment.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6">
        <Card className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold mb-4">Report Post</h2>
          
          <div className="mb-4">
            <Button
              onClick={analyzeWithGrok}
              disabled={isAnalyzing}
              className="w-full bg-purple-900/20 text-purple-400 border border-purple-700 hover:bg-purple-800/30"
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-purple-300 animate-spin"></div>
                  Analyzing...
                </div>
              ) : (
                <>Analyze with Grok</>
              )}
            </Button>
          </div>
          
          {fakeProbability && (
            <div className="mb-4 p-3 bg-zinc-800 rounded-md border border-zinc-700">
              <h3 className="text-sm font-medium mb-2 text-purple-300">Grok Analysis</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{fakeProbability}</p>
            </div>
          )}
          
          <form onSubmit={handleReport}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium mb-2">
                Reason for Reporting
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100"
              >
                <option value="fake">Misinformation/Fake News</option>
                <option value="harmful">Harmful Content</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {reason === 'other' && (
              <div className="mb-4">
                <label htmlFor="custom-reason" className="block text-sm font-medium mb-2">
                  Please Specify
                </label>
                <Input
                  id="custom-reason"
                  type="text"
                  placeholder="Provide details..."
                  className="w-full"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 ${
                  isSubmitting
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-red-900/20 text-red-400 border border-red-700 hover:bg-red-800/30'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ReportPostModal;
