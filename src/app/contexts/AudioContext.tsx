"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import { SampleType } from "../types/SampleType";
import { TransportClass } from "tone/build/esm/core/clock/Transport";

type Genre = "classical" | "folk-songs" | "jazz" | "popular" | null;

type SamplerWithFX = {
  sampler: Tone.Sampler;
  panVol: Tone.PanVol;
  highpass: Tone.Filter;
  lowpass: Tone.Filter;
};

type AudioContextType = {
  masterGainNode: Tone.Gain;
  setMasterGainLevel: React.Dispatch<React.SetStateAction<number>>;
  transport: React.RefObject<TransportClass>;
  audioContext: Tone.BaseContext | null;
  samplersRef: React.RefObject<Record<string, SamplerWithFX>>;
  kitRef: React.RefObject<Record<string, SamplerWithFX>>;
  locSamples: SampleType[];
  kitSamples: SampleType[];
  setGenre: React.Dispatch<React.SetStateAction<Genre>>;
  genre: Genre;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  quantizeActive: boolean;
  setQuantizeActive: React.Dispatch<React.SetStateAction<boolean>>;
  quantizeValue: number;
  setQuantizeValue: React.Dispatch<React.SetStateAction<number>>;
  allSampleData: SampleType[];
  setAllSampleData: React.Dispatch<React.SetStateAction<SampleType[]>>;
  selectedSample: SampleType | null;
  setSelectedSample: React.Dispatch<React.SetStateAction<SampleType | null>>;
  // getSampler,
  // updateSamplerSettings,
};

const AudioContextContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: React.PropsWithChildren) => {
  const [audioContext, setAudioContext] = useState<Tone.Context | null>(null);
  // const [query, setQuery] = useState<string>("jazz");
  const [locSamples, setLocSamples] = useState<SampleType[] | []>([]);
  const [kitSamples] = useState<SampleType[] | []>([
    {
      title: "Kick_Bulldog_2",
      label: "Kick",
      type: "drumKit",
      url: "/samples/drums/kicks/Kick_Bulldog_2.wav",
      id: "drum-1",
      times: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      title: "Snare_Astral_1",
      label: "Snare",
      type: "drumKit",
      url: "/samples/drums/snares/Snare_Astral_1.wav",
      id: "drum-2",
      times: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      title: "ClosedHH_Alessya_DS",
      type: "drumKit",
      label: "HiHat",
      url: "/samples/drums/hats/ClosedHH_Alessya_DS.wav",
      id: "drum-3",
      times: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      title: "Clap_Graphite",
      type: "drumKit",
      label: "Clap",
      url: "/samples/drums/claps/Clap_Graphite.wav",
      id: "drum-4",
      times: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
  ]);
  const [genre, setGenre] = useState<Genre | null>("jazz");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quantizeActive, setQuantizeActive] = useState<boolean>(false);
  const [quantizeValue, setQuantizeValue] = useState<number>(4);
  const [masterGainLevel, setMasterGainLevel] = useState<number>(1);
  const masterGainNode = useRef<Tone.Gain>(
    new Tone.Gain(masterGainLevel).toDestination()
  );
  const [allSampleData, setAllSampleData] = useState<SampleType[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleType | null>(null);

  const transport = useRef<TransportClass>(Tone.getTransport());

  // New ref to store all samplers and their FX chains
  const samplersRef = useRef<Record<string, SamplerWithFX>>({});
  const kitRef = useRef<Record<string, SamplerWithFX>>({});

  const makeSampler = (sampleId: string, sampleUrl: string) => {
    const sampler = new Tone.Sampler({
      urls: { C4: sampleUrl },
    });

    const panVol = new Tone.PanVol(0, 0);
    const highpass = new Tone.Filter(0, "highpass");
    const lowpass = new Tone.Filter(20000, "lowpass");

    // Connect the FX chain
    sampler.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(panVol);
    panVol.connect(masterGainNode.current).toDestination();

    return {
      sampler,
      panVol,
      highpass,
      lowpass,
    };
  };

  //create samplers for library of congress samples
  useEffect(() => {
    if (locSamples.length > 0) {
      locSamples.forEach(({ id, url }) => {
        samplersRef.current[id] = makeSampler(id, url);
      });
      console.log("samplersRef:", samplersRef.current);
    }
  }, [locSamples]);

  //create samplers for drum kit samples
  useEffect(() => {
    if (kitSamples.length > 0) {
      kitSamples.forEach(({ id, url }) => {
        kitRef.current[id] = makeSampler(id, url);
      });
      console.log("kitRef:", kitRef.current);
    }
  }, [kitSamples]);

  // // Function to create or get a sampler for a sample
  // const getSampler = (sampleId: string, sampleUrl: string, settings: any) => {
  //   if (!samplersRef.current[sampleId]) {
  //     // Create new sampler and FX chain
  //     const sampler = new Tone.Sampler({
  //       urls: { C4: sampleUrl },
  //       attack: settings.attack,
  //       release: settings.release,
  //     });

  //     const panVol = new Tone.PanVol(settings.pan, settings.volume);
  //     const highpass = new Tone.Filter(settings.highpass[0], "highpass");
  //     const lowpass = new Tone.Filter(settings.lowpass[0], "lowpass");

  //     // Connect the FX chain
  //     sampler.connect(highpass);
  //     highpass.connect(lowpass);
  //     lowpass.connect(panVol);
  //     panVol.connect(masterGainNode.current).toDestination();

  //     samplersRef.current[sampleId] = {
  //       sampler,
  //       panVol,
  //       highpass,
  //       lowpass,
  //     };
  //   }

  //   return samplersRef.current[sampleId];
  // };

  // // Function to update sampler settings
  // const updateSamplerSettings = (sampleId: string, settings: any) => {
  //   const samplerWithFX = samplersRef.current[sampleId];
  //   if (samplerWithFX) {
  //     const { sampler, gain, highpass, lowpass } = samplerWithFX;
  //     gain.gain.value = settings.gain;
  //     highpass.frequency.value = settings.fx.highpass[0];
  //     lowpass.frequency.value = settings.fx.lowpass[0];
  //     sampler.attack = settings.attack;
  //     sampler.release = settings.release;
  //   }
  // };

  // Universal cleanup function for samplers
  const cleanupSampler = (
    sampleId: string,
    ref: React.RefObject<SamplerWithFX>
  ) => {
    const samplerWithFX = ref.current[sampleId];
    if (samplerWithFX) {
      const { sampler, panVol, highpass, lowpass } = samplerWithFX;

      // Dispose of each Tone.js node
      sampler.dispose();
      panVol.dispose();
      highpass.dispose();
      lowpass.dispose();

      // Delete the reference
      delete ref.current[sampleId];
    }
  };

  // Start Tone.js context once and get transport
  useEffect(() => {
    const init = async () => {
      await Tone.start();
      console.log("Tone.js started");
      setAudioContext(Tone.getContext());
    };
    init();
  }, []);

  // Cleanup effect for samplers when component unmounts
  useEffect(() => {
    const samplersForCleanup = samplersRef.current;
    const kitSamplersForCleanup = kitRef.current;

    return () => {
      // Cleanup library of congress samplers
      Object.keys(samplersForCleanup).forEach((sampleId) => {
        cleanupSampler(sampleId, samplersRef);
      });

      // Cleanup kit samplers
      Object.keys(kitSamplersForCleanup).forEach((sampleId) => {
        cleanupSampler(sampleId, kitRef);
      });
    };
  }, []);

  //fetch library of congress samples
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        console.log("Fetching samples for genre:", genre);
        const response = await fetch("/fileList.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("FileList.json contents:", result);

        if (!result[genre]) {
          console.error("Genre not found in fileList.json:", genre);
          return;
        }
        console.log("Fetched for the curreng genre", result[genre]);

        const selectedSamples = await result[genre].slice(0, 8);
        if (selectedSamples) {
        }

        const sampleSet: SampleType[] = Array.from(
          selectedSamples,
          (sample, index) => {
            const sampleData = {
              id: `loc-${index + 1}`,
              type: `loc-${genre}`,
              title: sample,
              label: sample.split(".")[0],
              url: `/samples/loc/${genre}/excerpts/${sample}`,
              times: [],
              settings: {
                volume: 0,
                pan: 0,
                pitch: 0,
                finetune: 0,
                attack: 0,
                release: 0,
                highpass: [0, "highpass"],
                lowpass: [20000, "lowpass"],
              },
              attribution: "",
            };
            console.log("Created sample data:", sampleData);
            return sampleData;
          }
        );

        console.log("Setting locSamples with:", sampleSet);
        setLocSamples(sampleSet);
      } catch (error) {
        console.error("Error fetching samples:", error);
        // Set empty array on error to prevent null/undefined issues
        setLocSamples([]);
      }
    };

    fetchSamples();
  }, [genre]); // Dependency array ensures re-fetching when `genre` changes

  return (
    <AudioContextContext.Provider
      value={{
        masterGainNode,
        setMasterGainLevel,
        transport,
        audioContext,
        locSamples,
        kitSamples,
        setGenre,
        isPlaying,
        setIsPlaying,
        isRecording,
        setIsRecording,
        quantizeActive,
        setQuantizeActive,
        quantizeValue,
        setQuantizeValue,
        allSampleData,
        setAllSampleData,
        selectedSample,
        setSelectedSample,
        samplersRef,
        kitRef,
        genre,
        // getSampler,
        // updateSamplerSettings,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
};

export const useAudioContext = () => useContext(AudioContextContext);
