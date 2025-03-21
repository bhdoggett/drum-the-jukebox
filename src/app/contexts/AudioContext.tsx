"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  use,
} from "react";
import * as Tone from "tone";
import { SampleType, SampleSettings } from "../types/SampleType";
import { TransportClass } from "tone/build/esm/core/clock/Transport";

type Genre = "classical" | "folk-songs" | "jazz" | "popular";

type SamplerWithFX = {
  id: string;
  sampler: Tone.Sampler;
  panVol: Tone.PanVol;
  highpass: Tone.Filter;
  lowpass: Tone.Filter;
};

type AudioContextType = {
  masterGainNode: Tone.Gain;
  setMasterGainLevel: React.Dispatch<React.SetStateAction<number>>;
  transport: React.RefObject<TransportClass>;
  audioContext: Tone.Context | null;
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
  getSampleData: (id: string) => SampleType;
  updateSamplerStateSettings: (
    id: string,
    settings: Partial<SampleSettings>
  ) => void;
  updateSamplerStateSettings: (
    id: string,
    settings: Partial<SampleSettings>
  ) => void;
  updateSamplerRefSettings: (id: string, key: string, value: number) => void;
  setAllSampleData: React.Dispatch<React.SetStateAction<SampleType[]>>;
  selectedSampleId: string | null;
  setSelectedSampleId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedSampleId: string | null;
  setSelectedSampleId: React.Dispatch<React.SetStateAction<string | null>>;
  // getSampler,
  // updateSamplerSettings,
};

const AudioContextContext = createContext<AudioContextType | null>(null);

const getRandomNumberForId = () => {
  return Math.floor(Math.random() * 1000000);
};

export const AudioProvider = ({ children }: React.PropsWithChildren) => {
  const [audioContext, setAudioContext] = useState<Tone.Context | null>(null);
  const [locSamples, setLocSamples] = useState<SampleType[] | []>([]);
  const [kitSamples] = useState<SampleType[] | []>([
    {
      id: `kit-1-${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Kick_Bulldog_2",
      label: "Kick",
      url: "/samples/kits/kicks/Kick_Bulldog_2.wav",
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
      id: `kit-2-${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Snare_Astral_1",
      label: "Snare",
      url: "/samples/kits/snares/Snare_Astral_1.wav",
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
      id: `kit-3-${getRandomNumberForId()}`,
      type: "drumKit",
      title: "ClosedHH_Alessya_DS",
      label: "HiHat",
      url: "/samples/kits/hats/ClosedHH_Alessya_DS.wav",
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
      id: `kit-4-${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Clap_Graphite",
      label: "Clap",
      url: "/samples/kits/claps/Clap_Graphite.wav",
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
  const [genre, setGenre] = useState<Genre>("jazz");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quantizeActive, setQuantizeActive] = useState<boolean>(false);
  const [quantizeValue, setQuantizeValue] = useState<number>(4);
  const [masterGainLevel, setMasterGainLevel] = useState<number>(1);
  const masterGainNode = useRef<Tone.Gain>(
    new Tone.Gain(masterGainLevel).toDestination()
  );
  const [allSampleData, setAllSampleData] = useState<SampleType[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const transport = useRef<TransportClass>(Tone.getTransport());

  // New ref to store all samplers and their FX chains
  const samplersRef = useRef<Record<string, SamplerWithFX>>({});
  const kitRef = useRef<Record<string, SamplerWithFX>>({});

  // Function to create a sampler with FX chain
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
      id: sampleId,
      sampler,
      panVol,
      highpass,
      lowpass,
    };
  };

  const getSampleData = (id: string): SampleType => {
    console.log("Getting sample data for id:", id);
    return (
      allSampleData.find((sample) => sample.id === id) || {
        id: "",
        title: "",
        label: "",
        type: "",
        url: "",
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
      }
    );
  };

  const selectedSample =
    allSampleData.find((s) => s.id === selectedSampleId) || null;

  //testing things
  useEffect(() => {
    console.log("selectedSampleId:", selectedSampleId);
  }, [selectedSampleId]);
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
        samplersRef.current[id] = makeSampler(id, url);
      });
      console.log("samplersRef", samplersRef.current);
    }
  }, [kitSamples]);

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

        console.log("response:", response);

        const result = await response.json();
        console.log("result", result);

        if (!result[genre]) {
          console.error("Genre not found in fileList.json:", genre);
          return;
        }
        console.log("Fetched for the curreng genre", result[genre]);

        const selectedSamples = await result[genre].slice(0, 12);
        if (selectedSamples) {
        }

        const sampleSet: SampleType[] = Array.from(
          selectedSamples,
          (sample, index) => {
            const sampleData = {
              id: `loc-${index + 1}-${getRandomNumberForId()}`,
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

  // initialize the allSampleData state with the locSamples and kitSamples
  useEffect(() => {
    setAllSampleData([...locSamples, ...kitSamples]);
  }, [locSamples, kitSamples]);

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

  const updateSamplerStateSettings = (
    id: string,
    settings: Partial<SampleSettings>
  ): void => {
    setAllSampleData((prev) =>
      prev.map((sample) => {
        if (sample.id === id) {
          return {
            ...sample,
            settings: {
              ...sample.settings,
              ...settings,
            },
          };
        }
        return sample;
      })
    );
  };

  const updateSamplerRefSettings = (
    id: string,
    key: string,
    value: number
  ): void => {
    const samplerWithFX = samplersRef.current[id];
    if (samplerWithFX) {
      const { sampler, panVol, highpass, lowpass } = samplerWithFX;
      switch (key) {
        case "volume":
          panVol.volume.value = value;
          break;
        case "pan":
          panVol.pan.value = value;
          break;
        case "highpass":
          highpass.frequency.value = value;
          break;
        case "lowpass":
          lowpass.frequency.value = value;
          break;
        case "attack":
          sampler.attack = value;
          break;
        case "release":
          sampler.release = value;
          break;
        default:
          break;
      }
    }
  };

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
        getSampleData,
        updateSamplerStateSettings,
        updateSamplerRefSettings,
        setAllSampleData,
        selectedSampleId,
        setSelectedSampleId,
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
