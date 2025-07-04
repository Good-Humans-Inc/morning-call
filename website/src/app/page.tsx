"use client";

import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    city: '',
    localCallTime: '09:00',
    timezone: 'America/Los_Angeles',
    character: 'Xavier',
    description: 'A brief, friendly chat to start your day, {{your name}}. We\'ll check in on your schedule and maybe share a fun fact.'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update character description when name changes
    if (name === 'name') {
      setFormData(prev => {
        // Always start with the base template and replace {{your name}} with the current name
        const baseTemplate = 'A brief, friendly chat to start your day, {{your name}}. We\'ll check in on your schedule and maybe share a fun fact.';
        const updatedDescription = value.trim() 
          ? baseTemplate.replace(/{{your name}}/g, value)
          : baseTemplate;
        
        return {
          ...prev,
          description: updatedDescription
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('✅ Success! Your morning call has been scheduled.');
        // Reset form
        setFormData({
          name: '',
          phoneNumber: '',
          city: '',
          localCallTime: '09:00',
          timezone: 'America/Los_Angeles',
          character: 'Xavier',
          description: 'A brief, friendly chat to start your day, {{your name}}. We\'ll check in on your schedule and maybe share a fun fact.'
        });
      } else {
        setSubmitMessage(`❌ Error: ${result.error || 'Something went wrong'}`);
      }
    } catch (error) {
      setSubmitMessage('❌ Error: Unable to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="w-full max-w-4xl p-8 space-y-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">✨ Create Your Morning Call ✨</h1>
          <p className="mt-2 text-rose-700">Heyyyy this is <a href="https://www.tiktok.com/@injccwro" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline font-medium">@injccwro</a>, thanks for all the love 😭❤️ If somthing's not working or there's a character/feature you want to see, just lmk on tiktok! I also made a Discord.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1 - Personal Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-rose-700 border-b-2 border-pink-200 pb-2">💖 About You</h2>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-rose-700 mb-1">
                Your Name *
              </label>
              <input 
                type="text" 
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-rose-700 mb-1">
                Phone Number *
              </label>
              <input 
                type="tel" 
                id="phoneNumber"
                name="phoneNumber"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-rose-700 mb-1">
                City *
              </label>
              <input 
                type="text" 
                id="city"
                name="city"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label htmlFor="localCallTime" className="block text-sm font-medium text-rose-700 mb-1">
                Call Time *
              </label>
              <input 
                type="time" 
                id="localCallTime"
                name="localCallTime"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.localCallTime}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-rose-700 mb-1">
                Timezone *
              </label>
              <select 
                id="timezone"
                name="timezone"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.timezone}
                onChange={handleInputChange}
              >
                {/* North America */}
                <optgroup label="North America">
                  <option value="America/Los_Angeles">Pacific Time (PT) - Los Angeles, San Francisco</option>
                  <option value="America/Denver">Mountain Time (MT) - Denver, Phoenix</option>
                  <option value="America/Chicago">Central Time (CT) - Chicago, Dallas</option>
                  <option value="America/New_York">Eastern Time (ET) - New York, Miami</option>
                  <option value="America/Anchorage">Alaska Time (AKT) - Anchorage</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST) - Honolulu</option>
                  <option value="America/Toronto">Eastern Time (ET) - Toronto</option>
                  <option value="America/Vancouver">Pacific Time (PT) - Vancouver</option>
                </optgroup>
                
                {/* Europe */}
                <optgroup label="Europe">
                  <option value="Europe/London">Greenwich Mean Time (GMT) - London</option>
                  <option value="Europe/Paris">Central European Time (CET) - Paris, Berlin</option>
                  <option value="Europe/Rome">Central European Time (CET) - Rome, Madrid</option>
                  <option value="Europe/Amsterdam">Central European Time (CET) - Amsterdam</option>
                  <option value="Europe/Zurich">Central European Time (CET) - Zurich</option>
                  <option value="Europe/Stockholm">Central European Time (CET) - Stockholm</option>
                  <option value="Europe/Moscow">Moscow Time (MSK) - Moscow</option>
                </optgroup>
                
                {/* Asia */}
                <optgroup label="Asia">
                  <option value="Asia/Tokyo">Japan Standard Time (JST) - Tokyo</option>
                  <option value="Asia/Shanghai">China Standard Time (CST) - Shanghai, Beijing</option>
                  <option value="Asia/Hong_Kong">Hong Kong Time (HKT) - Hong Kong</option>
                  <option value="Asia/Singapore">Singapore Time (SGT) - Singapore</option>
                  <option value="Asia/Seoul">Korea Standard Time (KST) - Seoul</option>
                  <option value="Asia/Kolkata">India Standard Time (IST) - Mumbai, Delhi</option>
                  <option value="Asia/Dubai">Gulf Standard Time (GST) - Dubai</option>
                </optgroup>
                
                {/* Australia & Oceania */}
                <optgroup label="Australia & Oceania">
                  <option value="Australia/Sydney">Australian Eastern Time (AET) - Sydney, Melbourne</option>
                  <option value="Australia/Perth">Australian Western Time (AWT) - Perth</option>
                  <option value="Australia/Adelaide">Australian Central Time (ACT) - Adelaide</option>
                  <option value="Pacific/Auckland">New Zealand Time (NZST) - Auckland</option>
                </optgroup>
                
                {/* South America */}
                <optgroup label="South America">
                  <option value="America/Sao_Paulo">Brasília Time (BRT) - São Paulo, Rio</option>
                  <option value="America/Argentina/Buenos_Aires">Argentina Time (ART) - Buenos Aires</option>
                  <option value="America/Santiago">Chile Time (CLT) - Santiago</option>
                </optgroup>
                
                {/* Africa */}
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Eastern European Time (EET) - Cairo</option>
                  <option value="Africa/Johannesburg">South Africa Time (SAST) - Johannesburg</option>
                  <option value="Africa/Lagos">West Africa Time (WAT) - Lagos</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Column 2 - Character Selection */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-rose-700 border-b-2 border-pink-200 pb-2">🌸 Character Selection</h2>
            
            <div>
              <label htmlFor="character" className="block text-sm font-medium text-rose-700 mb-1">
                Choose a Character *
              </label>
              <select 
                id="character"
                name="character"
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.character}
                onChange={handleInputChange}
              >
                <optgroup label="Love and Deepspace">
                  <option value="Xavier">Xavier</option>
                  <option value="Zayne">Zayne</option>
                  <option value="Rafayel">Rafayel</option>
                  <option value="Sylus">Sylus</option>
                  <option value="Caleb">Caleb</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-rose-700 mb-1">
                Character Description *
              </label>
              <textarea 
                id="description"
                name="description"
                rows={8}
                required
                className="w-full px-3 py-2 bg-pink-50/50 border border-pink-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe how you want your AI assistant to behave during the call..."
              />
              <p className="mt-2 text-xs text-rose-600">
                This description guides the AI's personality during your call. The <code className="bg-pink-100 text-pink-800 px-1 py-0.5 rounded">{'{your name}'}</code> placeholder will be replaced with your name.
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="md:col-span-2 text-center space-y-4">
            {submitMessage && (
              <div className={`p-4 rounded-lg ${submitMessage.includes('Success') ? 'bg-pink-50 text-pink-800 border border-pink-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {submitMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-lg shadow-lg hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
            >
              {isSubmitting ? '💖 Scheduling...' : '✨ Schedule My Morning Call ✨'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
