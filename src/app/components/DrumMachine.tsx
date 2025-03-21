import { useState, useEffect } from "react";
import { useAudioContext } from "../contexts/AudioContext";
import DrumPad from "./DrumPad";

const DrumMachine = () => {
  const { samplersRef } = useAudioContext();
  const [samplersLoaded, setSamplersLoaded] = useState(false); // Track if samplers are loaded

  // Monitor changes to samplersRef and check if it has 8 samplers
  const [samplerCount, setSamplerCount] = useState(0);

  const [locSamplers, setLocSamplers] = useState({});
  const [kitSamplers, setKitSamplers] = useState({});

  // Update counts when refs change
  useEffect(() => {
    const checkSamplers = () => {
      setSamplerCount(Object.keys(samplersRef.current).length);
    };

    // Check immediately
    checkSamplers();

    // Set up an interval to check periodically
    const intervalId = setInterval(checkSamplers, 10);

    return () => clearInterval(intervalId);
  }, [samplersRef]); // Empty dependency array since we're using refs inside

  // Set loaded state based on counts
  // group samplers based on samplersRef.current.id name
  useEffect(() => {
    if (samplerCount === 16) {
      setSamplersLoaded(true);
      const kits = Object.fromEntries(
        Object.entries(samplersRef.current).filter((sampler) =>
          sampler[1].id.includes("kit")
        )
      );
      const locs = Object.fromEntries(
        Object.entries(samplersRef.current).filter((sampler) =>
          sampler[1].id.includes("loc")
        )
      );
      setKitSamplers(kits);
      setLocSamplers(locs);
    }
  }, [samplerCount, samplersRef]);

  if (!samplersLoaded) {
    return <div>Loading samplers...</div>; // Display loading message while samplers are not loaded
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 my-3">
        {Object.entries(locSamplers).map(([id, samplerNodes]) => (
          <DrumPad key={id} id={id} sampler={samplerNodes.sampler} />
        ))}
      </div>

      <hr />

      <div className="grid grid-cols-4 gap-4 my-3">
        {Object.entries(kitSamplers).map(([id, samplerNodes]) => (
          <DrumPad key={id} id={id} sampler={samplerNodes.sampler} />
        ))}
      </div>
    </div>
  );
};

export default DrumMachine;
