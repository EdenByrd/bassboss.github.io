const App = () => {
  const [productCatalog, setProductCatalog] = React.useState(null);
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState({
    genre: '',
    crowdSize: '',
    budget: '',
    transportation: '',
    power: '',
    venueType: '',
    boothMonitors: '',
  });
  const [quotes, setQuotes] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [emailSent, setEmailSent] = React.useState(false);
  const totalSteps = 8;

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

  const generateQuotes = () => {
    if (!productCatalog) return; // Don't run if data isn't loaded

    const { crowdSize, venueType, boothMonitors, genre } = answers;

    let budgetSystem = { tops: [], subs: [] };
    let premiumSystem = { tops: [], subs: [] };
    let monitorRec = null;

    // Base recommendations on crowd size
    if (crowdSize === 'under100') {
      budgetSystem = { tops: [productCatalog.tops[0], productCatalog.tops[0]], subs: [productCatalog.subs[0]] };
      premiumSystem = { tops: [productCatalog.tops[1], productCatalog.tops[1]], subs: [productCatalog.subs[1]] };
    } else if (crowdSize === 'upTo300') {
      budgetSystem = { tops: [productCatalog.tops[2], productCatalog.tops[2]], subs: [productCatalog.subs[1], productCatalog.subs[1]] };
      premiumSystem = { tops: [productCatalog.tops[3], productCatalog.tops[3]], subs: [productCatalog.subs[3], productCatalog.subs[3]] };
    } else if (crowdSize === 'upTo1000') {
        budgetSystem = { tops: [productCatalog.tops[3], productCatalog.tops[3]], subs: [productCatalog.subs[4], productCatalog.subs[4]] };
        premiumSystem = { tops: [productCatalog.tops[4], productCatalog.tops[4]], subs: [productCatalog.subs[5], productCatalog.subs[5]] };
    } else if (crowdSize === 'upTo5000') {
        budgetSystem = { tops: [productCatalog.tops[5], productCatalog.tops[5]], subs: [productCatalog.subs[6], productCatalog.subs[6], productCatalog.subs[6], productCatalog.subs[6]] };
        premiumSystem = { tops: [productCatalog.tops.find(t => t.id === 'Krakatoa-MK3'), productCatalog.tops.find(t => t.id === 'Krakatoa-MK3')], subs: [productCatalog.subs.find(s => s.id === 'Makara-MK3'), productCatalog.subs.find(s => s.id === 'Makara-MK3'), productCatalog.subs.find(s => s.id === 'Kraken-MK3'), productCatalog.subs.find(s => s.id === 'Kraken-MK3')] };
    } else {
        budgetSystem = { tops: [productCatalog.tops[4], productCatalog.tops[4]], subs: [productCatalog.subs[6], productCatalog.subs[6]] };
        premiumSystem = { tops: [productCatalog.tops[5], productCatalog.tops[5]], subs: [productCatalog.subs[7], productCatalog.subs[7]] };
    }

    if (venueType === 'outdoor' && (crowdSize === 'upTo1000' || crowdSize === 'over1000')) {
        budgetSystem.tops = [productCatalog.tops[2], productCatalog.tops[2], productCatalog.tops[2], productCatalog.tops[2]];
        premiumSystem.tops = [productCatalog.tops[5], productCatalog.tops[5]];
    } else if (venueType === 'indoor' && (crowdSize === 'upTo1000' || crowdSize === 'over1000')) {
        premiumSystem.tops = [productCatalog.tops[4], productCatalog.tops[4]];
    }

    if (crowdSize === 'upTo300' || crowdSize === 'upTo1000' || crowdSize === 'over1000' || crowdSize === 'upTo5000') {
        if (budgetSystem.subs.length < 2) { budgetSystem.subs = [productCatalog.subs[1], productCatalog.subs[1]]; }
        if (premiumSystem.subs.length < 2) { premiumSystem.subs = [productCatalog.subs[3], productCatalog.subs[3]]; }
    }
    
    const hasATSeries = (system) => system.tops.some(top => top.id === 'AT212-MK3' || top.id === 'AT312-MK3');
    if (hasATSeries(budgetSystem) && budgetSystem.subs.length < 2) {
        budgetSystem.subs = [productCatalog.subs[4], productCatalog.subs[4]];
    }
    if (hasATSeries(premiumSystem) && premiumSystem.subs.length < 2) {
        premiumSystem.subs = [productCatalog.subs[5], productCatalog.subs[5]];
    }

    if (boothMonitors === 'yes') {
        let monitorSystem = [];
        if (genre === 'live') {
            monitorSystem = [productCatalog.tops.find(t=>t.id==='CCM12-MK3'), productCatalog.tops.find(t=>t.id==='CCM12-MK3'), productCatalog.tops.find(t=>t.id==='CCM12-MK3')];
        } else if (genre === 'hiphop' || genre === 'electronic') {
            monitorSystem = [productCatalog.tops.find(t=>t.id==='DiaMon-MK3'), productCatalog.tops.find(t=>t.id==='DiaMon-MK3')];
        } else {
            monitorSystem = [productCatalog.tops.find(t=>t.id==='CCM12-MK3'), productCatalog.tops.find(t=>t.id==='CCM12-MK3')];
        }
        monitorRec = {
            system: monitorSystem,
            total: monitorSystem.reduce((acc, item) => acc + item.price, 0),
            amperage: monitorSystem.reduce((acc, item) => acc + item.amperage, 0)
        };
    }

    const calculateTotal = (system) => system.tops.reduce((acc, item) => acc + item.price, 0) + system.subs.reduce((acc, item) => acc + item.price, 0);
    const calculateAmperage = (system) => system.tops.reduce((acc, item) => acc + item.amperage, 0) + system.subs.reduce((acc, item) => acc + item.amperage, 0);
    const calculateSpl = (system) => {
        if (system.subs.length === 0) return 0;
        if (system.subs.length === 1) return system.subs[0].spl;
        const allSameSubs = system.subs.every(sub => sub.id === system.subs[0].id);
        if (allSameSubs) {
            return Math.round(system.subs[0].spl + 6 * (Math.log(system.subs.length) / Math.log(2)));
        }
        const totalSPL = 10 * Math.log10(system.subs.reduce((acc, sub) => acc + Math.pow(10, sub.spl / 10), 0));
        return Math.round(totalSPL);
    };

    setQuotes({
      budget: { system: budgetSystem, total: calculateTotal(budgetSystem), spl: calculateSpl(budgetSystem), amperage: calculateAmperage(budgetSystem) },
      premium: { system: premiumSystem, total: calculateTotal(premiumSystem), spl: calculateSpl(premiumSystem), amperage: calculateAmperage(premiumSystem) },
      monitorRec: monitorRec,
    });
    nextStep();
  };

  const sendEmail = () => {
    if (email) {
      console.log('Sending email to:', email);
      setEmailSent(true);
      setTimeout(() => {
          setStep(1);
          setEmail('');
          setEmailSent(false);
          setAnswers({ genre: '', crowdSize: '', budget: '', transportation: '', power: '', venueType: '', boothMonitors: '' });
      }, 3000);
    }
  };
  
  const renderStep = () => {
    const commonSelectClasses = "w-full p-3 border rounded mb-4 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";
    const primaryButtonClasses = "bg-yellow-400 text-black font-bold px-4 py-3 rounded hover:bg-yellow-500 transition-colors duration-300 w-full";
    const secondaryButtonClasses = "bg-gray-600 text-white font-bold px-4 py-3 rounded hover:bg-gray-500 transition-colors duration-300 w-1/2";
    
    const renderNavButtons = (onNext) => (
        <div className="flex justify-between gap-4">
            <button onClick={prevStep} className={secondaryButtonClasses}>Back</button>
            <button onClick={onNext} className={`${onNext === generateQuotes ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-yellow-400 text-black hover:bg-yellow-500'} font-bold px-4 py-3 rounded transition-colors duration-300 w-1/2`}>
                {onNext === generateQuotes ? 'Generate Quotes' : 'Next'}
            </button>
        </div>
    );

    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">What genres of music do you primarily play?</h2>
            <select name="genre" value={answers.genre} onChange={handleInputChange} className={commonSelectClasses}>
              <option value="">Select Genre...</option>
              <option value="hiphop">Hip-Hop / Rap</option>
              <option value="electronic">Electronic (EDM, House, Techno)</option>
              <option value="live">Live Band</option>
              <option value="rock">Rock / Pop</option>
              <option value="various">Various / Open Format</option>
            </select>
            <button onClick={nextStep} className={primaryButtonClasses}>Next</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">What is the estimated crowd size?</h2>
            <select name="crowdSize" value={answers.crowdSize} onChange={handleInputChange} className={commonSelectClasses}>
              <option value="">Select Crowd Size...</option>
              <option value="under100">Under 100 people</option>
              <option value="upTo300">Up to 300 people</option>
              <option value="upTo1000">Up to 1000 people</option>
              <option value="over1000">Over 1000 people</option>
              <option value="upTo5000">Up to 5000 people</option>
            </select>
            {renderNavButtons(nextStep)}
          </div>
        );
      case 3:
         return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Where will you primarily use the speakers?</h2>
            <select name="venueType" value={answers.venueType} onChange={handleInputChange} className={commonSelectClasses}>
                <option value="">Select Venue Type...</option>
                <option value="indoor">Primarily Indoor</option>
                <option value="outdoor">Primarily Outdoor</option>
                <option value="both">Both Indoor & Outdoor</option>
            </select>
            {renderNavButtons(nextStep)}
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Do you need sound for a DJ Booth / Stage?</h2>
            <select name="boothMonitors" value={answers.boothMonitors} onChange={handleInputChange} className={commonSelectClasses}>
                <option value="">Select an option...</option>
                <option value="yes">Yes, I need monitors.</option>
                <option value="no">No, I'm covered.</option>
            </select>
            {renderNavButtons(nextStep)}
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">What are your transportation limitations?</h2>
            <select name="transportation" value={answers.transportation} onChange={handleInputChange} className={commonSelectClasses}>
                <option value="">Select Transportation...</option>
                <option value="car">Car</option>
                <option value="suv">SUV / Van</option>
                <option value="truck">Truck / Trailer</option>
                <option value="none">No limitations</option>
            </select>
            {renderNavButtons(nextStep)}
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">What are your power limitations?</h2>
             <select name="power" value={answers.power} onChange={handleInputChange} className={commonSelectClasses}>
                <option value="">Select Power Availability...</option>
                <option value="standard">Standard Wall Outlets (15A)</option>
                <option value="dedicated">Dedicated Circuits (20A+)</option>
                <option value="generator">Generator</option>
                <option value="unknown">I don't know</option>
            </select>
            {renderNavButtons(nextStep)}
          </div>
        );
      case 7:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">What is your approximate budget? (Optional)</h2>
            <input type="number" name="budget" value={answers.budget} placeholder="Enter budget in USD..." onChange={handleInputChange} className={`${commonSelectClasses} placeholder-gray-400`} />
            {renderNavButtons(generateQuotes)}
          </div>
        );
      case 8:
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Your Custom BASSBOSS Quotes</h2>
            
            <div className="mb-8 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                <h3 className="text-xl font-bold mb-3 text-yellow-400">Your Requirements:</h3>
                <ul className="text-gray-300 grid md:grid-cols-3 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <li><strong>Genre:</strong> {answers.genre || 'N/A'}</li>
                    <li><strong>Crowd:</strong> {answers.crowdSize || 'N/A'}</li>
                    <li><strong>Venue:</strong> {answers.venueType || 'N/A'}</li>
                    <li><strong>Monitors:</strong> {answers.boothMonitors || 'N/A'}</li>
                    <li><strong>Transport:</strong> {answers.transportation || 'N/A'}</li>
                    <li><strong>Power:</strong> {answers.power || 'N/A'}</li>
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
                   <p className="font-bold text-gray-300">Est. Amperage: {quotes.budget.amperage.toFixed(1)}A @ 120V</p>
                </div>
                <div className="border p-6 rounded-lg shadow-lg bg-gray-800 border-gray-700">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">High-Capability System</h3>
                   <ul className="list-disc list-inside text-gray-300">
                    {quotes.premium.system.tops.map((item, i) => <li key={`p-top-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                    {quotes.premium.system.subs.map((item, i) => <li key={`p-sub-${i}`}>{item.name} <span className="text-xs text-gray-400">({item.dimensions}")</span> - ${item.price.toLocaleString()}</li>)}
                  </ul>
                  <p className="font-bold mt-4 text-white">Total MSRP: ${quotes.premium.total.toLocaleString()}</p>
                  <p className="font-bold text-gray-300">Est. Sustained SPL: ~{quotes.premium.spl} dB</p>
                  <p className="font-bold text-gray-300">Est. Amperage: {quotes.premium.amperage.toFixed(1)}A @ 120V</p>
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
      default:
        return <div>Loading...</div>;
    }
  };

  if (!productCatalog) {
    return (
        <div className="bg-black min-h-screen flex items-center justify-center text-white">
            Loading Speaker Data...
        </div>
    );
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center font-sans p-4 relative overflow-hidden">
      <div className="background-container absolute inset-0"></div>
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 p-8 rounded-lg shadow-2xl w-full max-w-4xl z-10">
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
