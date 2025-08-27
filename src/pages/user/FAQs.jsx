import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Droplet, 
  Heart, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Users,
  CalendarClock,
  Stethoscope,
  List,
  TimerReset,
  Search,
} from 'lucide-react';

const FAQs = () => {
  const faqData = {
    'About Blood Donation': {
      icon: <Droplet className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" aria-hidden="true" />,
      color: 'red',
      description: 'Learn about the basics of blood donation and its importance',
      questions: [
        {
          question: 'What is blood donation?',
          answer: 'Blood donation is a voluntary procedure that can help save lives. During blood donation, a needle is used to draw blood from a vein in your arm. The blood is then stored and used for patients who need blood transfusions.',
          icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" aria-hidden="true" />
        },
        {
          question: 'How is donated blood used?',
          answer: 'Donated blood is used for: Trauma patients, surgical procedures, cancer treatments, blood disorders, and other medical conditions requiring blood transfusions.',
          icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" aria-hidden="true" />
        }
      ]
    },
    'Eligibility Requirements': {
      icon: <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" aria-hidden="true" />,
      color: 'emerald',
      description: 'Check if you meet the requirements to donate blood',
      questions: [
        {
          question: 'Who can donate blood?',
          answer: 'Generally, you can donate blood if you: Are at least 18 years old, weigh at least 45kg, are in good health, and have not donated blood in the last 3 months.',
          icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" aria-hidden="true" />
        },
        {
          question: 'How often can I donate blood?',
          answer: 'A healthy individual can donate blood every 3 months. This interval allows your body to replenish the donated blood cells.',
          icon: <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" aria-hidden="true" />
        },
        {
          question: 'What should I do before donating blood?',
          answer: 'Before donating blood: Get enough sleep, eat a healthy meal, drink plenty of water, and avoid fatty foods. Bring a valid ID and a list of medications you are taking.',
          icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" aria-hidden="true" />
        }
      ]
    },
    'Donation Process': {
      icon: <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" aria-hidden="true" />,
      color: 'blue',
      description: 'Understanding what happens during blood donation',
      questions: [
        {
          question: 'How long does blood donation take?',
          answer: 'The actual blood donation takes about 8-10 minutes. However, the entire process, including registration, health screening, and post-donation rest, takes about 45 minutes to 1 hour.',
          icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" aria-hidden="true" />
        },
        {
          question: 'What happens during the donation process?',
          answer: 'The process includes registration, health screening (blood pressure, temperature, hemoglobin), the actual donation, and a short rest period with refreshments.',
          icon: <List className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" aria-hidden="true" />
        }
      ]
    },
    'After Donation Care': {
      icon: <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" aria-hidden="true" />,
      color: 'purple',
      description: 'Important care instructions after donating blood',
      questions: [
        {
          question: 'What should I do after donating blood?',
          answer: 'After donation: Rest for 10-15 minutes, drink extra fluids, avoid strenuous activities for the rest of the day, and keep the bandage on for several hours.',
          icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
        },
        {
          question: 'Recovery time after donation',
          answer: 'Your body replaces the fluid lost from donation within 24 hours. The red blood cells are replaced within a few weeks.',
          icon: <TimerReset className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
        }
      ]
    }
  };

  const [openCategories, setOpenCategories] = useState({});
  const [openQuestions, setOpenQuestions] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleQuestion = (id) => {
    setOpenQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqData = useMemo(() => {
    return Object.entries(faqData).reduce((acc, [category, data]) => {
      const filteredQuestions = data.questions.filter(
        q => 
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredQuestions.length > 0) {
        acc[category] = { ...data, questions: filteredQuestions };
      }
      return acc;
    }, {});
  }, [searchTerm]);

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
            Everything you need to know about blood donation
          </p>

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Search frequently asked questions"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {Object.entries(filteredFaqData).map(([category, { icon, color, description, questions }], categoryIndex) => (
            <div 
              key={category} 
              className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => toggleCategory(category)}
                onKeyDown={(e) => handleKeyDown(e, () => toggleCategory(category))}
                className={`w-full px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 hover:bg-${color}-50 transition-colors focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-inset`}
                aria-expanded={openCategories[category]}
                aria-controls={`faq-category-${categoryIndex}`}
              >
                <div className={`p-2 sm:p-3 bg-${color}-50 rounded-xl flex-shrink-0`}>
                  {icon}
                </div>
                <div className="flex-grow text-left">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{category}</h2>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-${color}-50 flex-shrink-0`}>
                  {openCategories[category] ? (
                    <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} aria-hidden="true" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} aria-hidden="true" />
                  )}
                </div>
              </button>

              {openCategories[category] && (
                <div 
                  id={`faq-category-${categoryIndex}`}
                  className="border-t divide-y divide-gray-100"
                  role="region"
                  aria-labelledby={`category-${categoryIndex}`}
                >
                  {questions.map((faq, questionIndex) => (
                    <div key={questionIndex} className="transition-all duration-200">
                      <button
                        onClick={() => toggleQuestion(`${categoryIndex}-${questionIndex}`)}
                        onKeyDown={(e) => handleKeyDown(e, () => toggleQuestion(`${categoryIndex}-${questionIndex}`))}
                        className={`w-full px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 hover:bg-${color}-50 transition-colors focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-inset`}
                        aria-expanded={openQuestions[`${categoryIndex}-${questionIndex}`]}
                        aria-controls={`faq-answer-${categoryIndex}-${questionIndex}`}
                      >
                        <div className="flex-shrink-0">
                          {faq.icon}
                        </div>
                        <h3 className="text-left font-medium text-gray-900 flex-grow text-sm sm:text-base">
                          {faq.question}
                        </h3>
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-${color}-50 flex-shrink-0`}>
                          {openQuestions[`${categoryIndex}-${questionIndex}`] ? (
                            <ChevronUp className={`w-3 h-3 sm:w-4 sm:h-4 text-${color}-600`} aria-hidden="true" />
                          ) : (
                            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-${color}-600`} aria-hidden="true" />
                          )}
                        </div>
                      </button>

                      {openQuestions[`${categoryIndex}-${questionIndex}`] && (
                        <div 
                          id={`faq-answer-${categoryIndex}-${questionIndex}`}
                          className={`px-4 sm:px-6 py-4 bg-${color}-50 ml-12 sm:ml-16 border-l-4 border-${color}-200 transition-all duration-200 ease-in-out`}
                          role="region"
                          aria-labelledby={`question-${categoryIndex}-${questionIndex}`}
                        >
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {Object.keys(filteredFaqData).length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No matching FAQs found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQs;