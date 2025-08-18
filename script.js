const App = () => {
  const [productCatalog, setProductCatalog] = React.useState(null);
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState({
    genre: '',
    crowdSize: '',
    venueType: '',
    boothMonitors: '',
    boothSubs: '', // New state for the conditional question
    transportation: '',
    power: '',
    budget: '',
  });
  const [quotes, setQuotes] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [emailSent, setEmailSent] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const totalSteps = 9; // Increased total steps to accommodate the new question

  React.useEffect(() => {
    fetch('speakers.json')
      .then(response => response.json())
      .then(data => setProductCatalog(data))
      .catch(error => console.error("Could not load speaker data:", error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Custom navigation logic to handle the conditional question
  const handleNextAfterMonitors = () => {
    if (answers.boothMonitors === 'yes' && answers.genre !== 'live') {
      setStep(5); // Go to the new "booth subs" question
    } else {
      setStep(6); // Skip the "booth subs" question
    }
  };

  const handleBackFromTransport = () => {
      if (answers.boothMonitors === 'yes' && answers.genre !== 'live') {
          setStep(5); // Go back to the "booth subs" question
      } else {
          setStep(4); // Go back to the "booth monitors" question
      }
  };


  // Helper function to calculate volume
  const getVolume = (dimensions) => {
      if (typeof dimensions !== 'string') return 0;
      const parts = dimensions.split('x').map(d => parseFloat(d.trim()));
      if (parts.length !== 3 || parts.some(isNaN)) return 0;
      return parts[0] * parts[1] * parts[2];
  };

  const calculateSystemVolume = (system) => {
      const topVolume = system.tops.reduce((acc, item) => acc + getVolume(item.dimensions), 0);
      const subVolume = system.subs.reduce((acc, item) => acc + getVolume(item.dimensions), 0);
      return (topVolume + subVolume) / 1728; // Convert cubic inches to cubic feet
  };

  const validateAndGenerateQuotes = () => {
    setErrorMessage(''); // Reset error message
    const { crowdSize, budget, transportation } = answers;
    
    const vehicleCapacities = {
        car: 30,
        suv: 100,
        truck: 1000,
        none: Infinity,
    };

    const minSystemCosts = {
        under100: 5000,
        upTo300: 14000,
        upTo1000: 22000,
        over1000: 35000,
        upTo5000: 50000,
    };

    if (budget && minSystemCosts[crowdSize] && budget < minSystemCosts[crowdSize]) {
        setErrorMessage(`Your budget of $${budget} may be too low for a crowd of this size. A typical system starts around $${minSystemCosts[crowdSize].toLocaleString()}. Please adjust your budget or crowd size.`);
        setStep(8);
        return;
    }
    
    let tempSystem = { tops: [], subs: [] };
    if (crowdSize === 'under100') tempSystem = { tops: [productCatalog.tops[0], productCatalog.tops[0]], subs: [productCatalog.subs[0]] };
    else if (crowdSize === 'upTo300') tempSystem = { tops: [productCatalog.tops[2], productCatalog.tops[2]], subs: [productCatalog.subs[1], productCatalog.subs[1]] };
    else if (crowdSize === 'upTo1000') tempSystem = { tops: [productCatalog.tops[3], productCatalog.tops[3]], subs: [productCatalog.subs[4], productCatalog.subs[4]] };
    else tempSystem = { tops: [productCatalog.tops[4], productCatalog.tops[4]], subs: [productCatalog.subs[6], productCatalog.subs[6]] };

    const systemVolume = calculateSystemVolume(tempSystem);
    const transportCapacity = vehicleCapacities[transportation];

    if (transportCapacity && systemVolume > transportCapacity) {
        setErrorMessage(`A system for this crowd size may not fit in your selected vehicle (${transportation}). The estimated volume is ~${systemVolume.toFixed(1)} ft³, which may exceed your vehicle's capacity of ~${transportCapacity} ft³. Please select a larger vehicle option.`);
        setStep(8);
        return;
    }

    generateQuotes();
  };


  const generateQuotes = () => {
    if (!productCatalog) return;

    const { crowdSize, venueType, boothMonitors, genre, boothSubs } = answers;
    const isBassHeavy = genre === 'hiphop' || genre === 'electronic';

    let budgetSystem = { tops: [], subs: [] };
    let premiumSystem = { tops: [], subs: [] };
    let monitorRec = null;

    const findSub = (id) => productCatalog.subs.find(s => s.id === id);
    const findTop = (id) => productCatalog.tops.find(t => t.id === id);

    if (crowdSize === 'under100') {
      budgetSystem = { tops: [findTop('SV9-MK3'), findTop('SV9-MK3')], subs: [isBassHeavy ? findSub('DJ18S-MK3') : findSub('BB15-MK3')] };
      premiumSystem = { tops: [findTop('DiaMon-MK3'), findTop('DiaMon-MK3')], subs: [findSub('DJ18S-MK3')] };
    } else if (crowdSize === 'upTo300') {
      budgetSystem = { tops: [findTop('DV12-MK3'), findTop('DV12-MK3')], subs: [findSub('DJ18S-MK3'), findSub('DJ18S-MK3')] };
      premiumSystem = { tops: [findTop('AT212-MK3'), findTop('AT212-MK3')], subs: [findSub('VS21-MK3'), findSub('VS21-MK3')] };
    } else if (crowdSize === 'upTo1000') {
        budgetSystem = { tops: [findTop('AT212-MK3'), findTop('AT212-MK3')], subs: [findSub('SSP118-MK3'), findSub('SSP118-MK3'), findSub('SSP118-MK3'), findSub('SSP118-MK3')] };
        premiumSystem = { tops: [findTop('AT312-MK3'), findTop('AT312-MK3')], subs: [findSub('SSP218-MK3'), findSub('SSP218-MK3')] };
    } else if (crowdSize === 'over1000') {
        budgetSystem = { tops: [findTop('AT312-MK3'), findTop('AT312-MK3')], subs: [findSub('SSP218-MK3'), findSub('SSP218-MK3'), findSub('SSP218-MK3'), findSub('SSP218-MK3')] };
        premiumSystem = { tops: [findTop('MFLA-MK3'), findTop('MFLA-MK3')], subs: [findSub('Kraken-MK3'), findSub('Kraken-MK3')] };
    } else if (crowdSize === 'upTo5000') {
        budgetSystem = { tops: [findTop('MFLA-MK3'), findTop('MFLA-MK3'), findTop('MFLA-MK3'), findTop('MFLA-MK3')], subs: [findSub('Makara-MK3'), findSub('Makara-MK3'), findSub('Makara-MK3'), findSub('Makara-MK3')] };
        premiumSystem = { tops: [findTop('Krakatoa-MK3'), findTop('Krakatoa-MK3')], subs: [findSub('Makara-MK3'), findSub('Makara-MK3'), findSub('Kraken-MK3'), findSub('Kraken-MK3')] };
    }

    const hasAT212 = (system) => system.tops.some(top => top && top.id === 'AT212-MK3');
    const hasAT312 = (system) => system.tops.some(top => top && top.id === 'AT312-MK3');

    if(hasAT212(budgetSystem)) { budgetSystem.subs = [findSub('VS21-MK3'), findSub('VS21-MK3')]; }
    if(hasAT212(premiumSystem)) { premiumSystem.subs = [findSub('SSP218-MK3'), findSub('SSP218-MK3')]; }
    if(hasAT312(budgetSystem)) { budgetSystem.subs = [findSub('SSP218-MK3'), findSub('SSP218-MK3')]; }
    if(hasAT312(premiumSystem)) { premiumSystem.subs = [findSub('Kraken-MK3'), findSub('Kraken-MK3')]; }

    if (boothMonitors === 'yes') {
        let monitorSystem = [];
        if (genre === 'live') {
            monitorSystem = [findTop('CCM12-MK3'), findTop('CCM12-MK3'), findTop('CCM12-MK3')];
        } else if (isBassHeavy) {
            monitorSystem = [findTop('DiaMon-MK3'), findTop('DiaMon-MK3')];
        } else {
            monitorSystem = [findTop('CCM12-MK3'), findTop('CCM12-MK3')];
        }

        if (boothSubs === 'yes') {
            monitorSystem.push(findSub('DJ18S-MK3'), findSub('DJ18S-MK3'));
        }

        monitorRec = {
            system: monitorSystem,
            total: monitorSystem.reduce((acc, item) => acc + (item ? item.price : 0), 0),
            amperage: monitorSystem.reduce((acc, item) => acc + (item ? item.amperage : 0), 0)
        };
    }

    const calculateTotal = (system) => {
        const topTotal = system.tops.reduce((acc, item) => acc + (item ? item.price : 0), 0);
        const subTotal = system.subs.reduce((acc, item) => acc + (item ? item.price : 0), 0);
        return topTotal + subTotal;
    };
    
    const calculateAmperage = (system) => {
        const topAmps = system.tops.reduce((acc, item) => acc + (item ? item.amperage : 0), 0);
        const subAmps = system.subs.reduce((acc, item) => acc + (item ? item.amperage : 0), 0);
        return topAmps + subAmps;
    };

    const getLowestFreq = (system) => {
        if (system.subs.length === 0) return 'N/A';
        const lowestFrequency = Math.min(...system.subs.map(sub => sub.lowest_freq));
        if (system.subs.length > 2) return lowestFrequency - 3;
        return lowestFrequency;
    };

    const calculateSpl = (system) => {
        if (!system.subs || system.subs.length === 0) return 0;
        const validSubs = system.subs.filter(sub => sub && typeof sub.spl === 'number');
        if (validSubs.length === 0) return 0;
        if (validSubs.length === 1) return validSubs[0].spl;
        const allSameSubs = validSubs.every(sub => sub.id === validSubs[0].id);
        if (allSameSubs) {
            return Math.round(validSubs[0].spl + 6 * (Math.log(validSubs.length) / Math.log(2)));
        }
        const totalSPL = 10 * Math.log10(validSubs.reduce((acc, sub) => acc + Math.pow(10, sub.spl / 10), 0));
        return Math.round(totalSPL);
    };

    setQuotes({
      budget: { system: budgetSystem, total: calculateTotal(budgetSystem), spl: calculateSpl(budgetSystem), amperage: calculateAmperage(budgetSystem), lowest_freq: getLowestFreq(budgetSystem), volume: calculateSystemVolume(budgetSystem) },
      premium: { system: premiumSystem, total: calculateTotal(premiumSystem), spl: calculateSpl(premiumSystem), amperage: calculateAmperage(premiumSystem), lowest_freq: getLowestFreq(premiumSystem), volume: calculateSystemVolume(premiumSystem) },
      monitorRec: monitorRec,
    });
    setStep(9); // Go to the final quote page
  };

  const sendEmail = () => {
    if (!email || !quotes) return;
    const formatSystemForEmail = (systemData, title) => {
        if (!systemData || !systemData.system) return '';
        let html = `<h2>${title}</h2><ul>`;
        if (Array.isArray(systemData.system.tops)) {
            systemData.system.tops.forEach(item => { html += `<li>${item.name} - $${item.price.toLocaleString()}</li>`; });
        }
        if (Array.isArray(systemData.system.subs)) {
            systemData.system.subs.forEach(item => { html += `<li>${item.name} - $${item.price.toLocaleString()}</li>`; });
        }
        if (Array.isArray(systemData.system) && !systemData.system.tops && !systemData.system.subs) {
            systemData.system.forEach(item => { html += `<li>${item.name} - $${item.price.toLocaleString()}</li>`; });
        }
        html += `</ul><p><b>Total MSRP:</b> $${systemData.total.toLocaleString()}</p><hr>`;
        return html;
    };
    const emailBody = `<h1>Your BASSBOSS System Recommendation</h1><p>Here are the custom system quotes you generated based on your requirements.</p><hr>${formatSystemForEmail(quotes.budget, 'Standard System')}${formatSystemForEmail(quotes.premium, 'High-Capability System')}${quotes.monitorRec ? formatSystemForEmail(quotes.monitorRec, 'Booth Monitor Recommendation') : ''}`;
    const templateParams = { to_email: email, subject: "Your BASSBOSS System Quote", message: emailBody };
    emailjs.send('service_6hqukwx', 'template_lznlhid', templateParams, 'TV2Z1HnCPye7yY8QQ')
        .then((response) => {
            console.log('SUCCESS!', response.status, response.text);
            setEmailSent(true);
            setTimeout(() => {
                setStep(1);
                setEmail('');
                setEmailSent(false);
                setAnswers({ genre: '', crowdSize: '', budget: '', transportation: '', power: '', venueType: '', boothMonitors: '', boothSubs: '' });
            }, 3000);
        }, (error) => {
            console.log('FAILED...', error);
            alert('There was an error sending your quote. Please try again.');
        });
  };

  const formatAnswerKey = (key) => {
    const words = key.replace(/([A-Z])/g, ' $1');
    return words.toUpperCase();
  };
  
  const renderStep = () => {
    const commonSelectClasses = "w-auto p-3 border rounded bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";
    const primaryButtonClasses = "w-auto p-3 border rounded bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors duration-300";
    const secondaryButtonClasses = "w-auto p-3 border rounded bg-gray-600 text-white font-bold hover:bg-gray-500 transition-colors duration-300";
    
    const renderNavButtons = (onNext, onBack) => (
        <div className="flex justify-end gap-4">
            <button onClick={onBack || prevStep} className={secondaryButtonClasses}>Back</button>
            <button onClick={onNext} className={`${onNext === validateAndGenerateQuotes ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-yellow-400 text-black hover:bg-yellow-500'} font-bold p-3 rounded transition-colors duration-300 w-auto`}>
                {onNext === validateAndGenerateQuotes ? 'Generate Quotes' : 'Next'}
            </button>
        </div>
    );

    const stepContent = (
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">{
          [
            "What genres of music do you primarily play?",
            "What is the estimated crowd size?",
            "Where will you primarily use the speakers?",
            "Do you need sound for a DJ Booth / Stage?",
            "Do you want subwoofers in the booth?", // New Step 5
            "What are your transportation limitations?",
            "What are your power limitations?",
            errorMessage ? <span className="text-red-400">Input Error</span> : "What is your approximate budget? (Optional)",
            "Your Custom BASSBOSS Quotes"
          ][step - 1]
        }</h2>
        {errorMessage && step === 8 && <p className="text-red-400 my-2">{errorMessage}</p>}
        <div className="flex justify-between items-center w-full mt-4">
          <div>
            {step === 1 && <select name="genre" value={answers.genre} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select Genre...</option><option value="hiphop">Hip-Hop / Rap</option><option value="electronic">Electronic (EDM, House, Techno)</option><option value="live">Live Band</option><option value="rock">Rock / Pop</option><option value="various">Various / Open Format</option></select>}
            {step === 2 && <select name="crowdSize" value={answers.crowdSize} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select Crowd Size...</option><option value="under100">Under 100</option><option value="upTo300">Up to 300</option><option value="upTo1000">Up to 1000</option><option value="over1000">Over 1000</option><option value="upTo5000">Up to 5000</option></select>}
            {step === 3 && <select name="venueType" value={answers.venueType} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select Venue Type...</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option><option value="both">Both</option></select>}
            {step === 4 && <select name="boothMonitors" value={answers.boothMonitors} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select an option...</option><option value="yes">Yes</option><option value="no">No</option></select>}
            {step === 5 && <select name="boothSubs" value={answers.boothSubs} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select an option...</option><option value="yes">Yes</option><option value="no">No</option></select>}
            {step === 6 && <select name="transportation" value={answers.transportation} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select Transportation...</option><option value="car">Car</option><option value="suv">SUV / Van</option><option value="truck">Truck / Trailer</option><option value="none">None</option></select>}
            {step === 7 && <select name="power" value={answers.power} onChange={handleInputChange} className={commonSelectClasses}><option value="">Select Power...</option><option value="standard">Standard Outlets (15A)</option><option value="dedicated">Dedicated Circuits (20A+)</option><option value="generator">Generator</option><option value="unknown">Unknown</option></select>}
            {step === 8 && <input type="number" name="budget" value={answers.budget} placeholder="Enter budget in USD..." onChange={handleInputChange} className={`${commonSelectClasses} placeholder-gray-400`} />}
          </div>
          <div className="ml-4">
            {step === 1 && <button onClick={nextStep} className={primaryButtonClasses}>Next</button>}
            {step === 2 && renderNavButtons(nextStep)}
            {step === 3 && renderNavButtons(nextStep)}
            {step === 4 && renderNavButtons(handleNextAfterMonitors)}
            {step === 5 && renderNavButtons(nextStep)}
            {step === 6 && renderNavButtons(nextStep, handleBackFromTransport)}
            {step === 7 && renderNavButtons(nextStep)}
            {step === 8 && renderNavButtons(validateAndGenerateQuotes)}
          </div>
        </div>
      </div>
    );
    
    if (step === 9) {
      // Final quote page has a different layout
      return (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Your Custom BASSBOSS Quotes</h2>
            
            <div className="mb-8 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                <h3 className="text-xl font-bold mb-3 text-yellow-400">YOUR REQUIREMENTS</h3>
                <ul className="text-gray-300 grid md:grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(answers).filter(([key, value]) => value && key !== 'budget').map(([key, value]) => (
                        <li key={key}><strong>{formatAnswerKey(key)}:</strong> {value.toUpperCase()}</li>
                    ))}
                </ul>
            </div>

            {quotes && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="border p-6 rounded-lg shadow-lg bg-gray-800 border-gray-700">
                  <h3 className="text-xl font-bold mb-4 text-green-400">Standard System</h3>
                  <ul className="list-disc list-inside text-gray-300">
                    {quotes.budget.system.tops.map((item, i) => <li key={`b-top-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                    {quotes.budget.system.subs.map((item, i) => <li key={`b-sub-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                  </ul>
                  <p className="font-bold mt-4 text-white">Total MSRP: ${quotes.budget.total.toLocaleString()}</p>
                   <p className="font-bold text-gray-300">Est. Sustained SPL: ~{quotes.budget.spl} dB</p>
                   <p className="font-bold text-gray-300">Est. Low End Extension: ~{quotes.budget.lowest_freq} Hz</p>
                   <p className="font-bold text-gray-300">Est. Amperage: {quotes.budget.amperage.toFixed(1)}A @ 120V</p>
                   <p className="font-bold text-gray-300">Est. Total Volume: {quotes.budget.volume.toFixed(1)} ft³</p>
                </div>
                <div className="border p-6 rounded-lg shadow-lg bg-gray-800 border-gray-700">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">High-Capability System</h3>
                   <ul className="list-disc list-inside text-gray-300">
                    {quotes.premium.system.tops.map((item, i) => <li key={`p-top-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                    {quotes.premium.system.subs.map((item, i) => <li key={`p-sub-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                  </ul>
                  <p className="font-bold mt-4 text-white">Total MSRP: ${quotes.premium.total.toLocaleString()}</p>
                  <p className="font-bold text-gray-300">Est. Sustained SPL: ~{quotes.premium.spl} dB</p>
                  <p className="font-bold text-gray-300">Est. Low End Extension: ~{quotes.premium.lowest_freq} Hz</p>
                  <p className="font-bold text-gray-300">Est. Amperage: {quotes.premium.amperage.toFixed(1)}A @ 120V</p>
                  <p className="font-bold text-gray-300">Est. Total Volume: {quotes.premium.volume.toFixed(1)} ft³</p>
                </div>
              </div>
            )}
            {quotes && quotes.monitorRec && (
                <div className="mt-8 border p-6 rounded-lg shadow-lg bg-gray-800 border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-purple-400">Booth Monitor Recommendation</h3>
                    <ul className="list-disc list-inside text-gray-300">
                        {quotes.monitorRec.system.map((item, i) => <li key={`mon-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                    </ul>
                    <p className="font-bold mt-4 text-white">Total MSRP: ${quotes.monitorRec.total.toLocaleString()}</p>
                    <p className="font-bold text-gray-300">Est. Amperage: {quotes.monitorRec.amperage.toFixed(1)}A @ 120V</p>
                </div>
            )}
            <div className="mt-8 text-center">
                <p className="mb-4 text-gray-300">Would you like these quotes emailed to you?</p>
                {emailSent ? (
                    <p className="text-green-400 font-semibold">Email sent successfully! Resetting...</p>
                ) : (
                    <div className="flex justify-center items-center">
                        <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 border bg-gray-700 border-gray-600 text-white rounded-l-md w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"/>
                        <button onClick={sendEmail} className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-r-md hover:bg-yellow-500">Send</button>
                    </div>
                )}
                 <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-400 hover:text-yellow-400 hover:underline">Start Over</button>
            </div>
          </div>
      );
    }

    return stepContent;
  };

  if (!productCatalog) {
    return (
        <div className="bg-black min-h-screen flex items-center justify-center text-white">
            Loading Speaker Data...
        </div>
    );
  }

  return (
    <div className="bg-gray-900/90 border border-gray-700 p-8 rounded-lg shadow-2xl w-full max-w-4xl relative overflow-hidden">
        <div className="background-container absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10">
            <img 
                src="https://cdn.prod.website-files.com/65f2989505d63045bb49388a/65f2989505d63045bb493ac9_0ada5c33b4fc13ca0473237e7f53bd98_BASSBOSS-Logo-Yellow-600px-web.webp" 
                alt="BASSBOSS Logo"
                className="h-12 mx-auto mb-2"
            />
            <p className="text-center text-gray-400 mb-8">MK3 System Recommender</p>
            {renderStep()}
             <div className="mt-8">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                </div>
            </div>
        </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
