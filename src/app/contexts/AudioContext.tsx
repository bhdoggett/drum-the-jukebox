"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import { SampleType, SampleSettings } from "../types/SampleType";
import { TransportClass } from "tone/build/esm/core/clock/Transport";
import {
  inventingEntertainment,
  VD_inventingEntertainment,
  varietyStageSoundRecordingsAndMotionPictures,
  VD_varietyStageSoundRecordingsAndMotionPictures,
  theJoeSmithCollection,
  VD_theJoeSmithCollection,
  freeMusicArchive,
  VD_freeMusicArchive,
  musicBoxProject,
  VD_musicBoxProject,
  tonySchwartzCollection,
  VD_tonySchwartzCollection,
  americanEnglishDialectRecordings,
  VD_americanEnglishDialectRecordings,
  theNationalScreeningRoom,
  VD_theNationalScreeningRoom,
  njbBlues,
  VD_njbBlues,
  njbJazz,
  VD_njbJazz,
  njbFolkMusic,
  VD_njbFolkMusic,
  njbOpera,
  VD_njbOpera,
  njbMusicalTheater,
  VD_njbMusicalTheater,
  njbClassicalMusic,
  VD_njbClassicalMusic,
  njbPopularMusic,
  VD_njbPopularMusic,
} from "../../lib/sampleSources";
import { getCollectionArray } from "@/lib/collections";
import { getTitle, getLabel } from "../functions/getTitle";

type Genre = "classical" | "folk-songs" | "jazz" | "popular";

type SamplerWithFX = {
  id: string;
  sampler: Tone.Sampler;
  panVol: Tone.PanVol;
  highpass: Tone.Filter;
  lowpass: Tone.Filter;
};

type AudioContextType = {
  masterGainNode: RefObject<Tone.Gain<"gain">>;
  setMasterGainLevel: React.Dispatch<React.SetStateAction<number>>;
  transport: React.RefObject<TransportClass>;
  audioContext: Tone.Context | null;
  samplersRef: React.RefObject<Record<string, SamplerWithFX>>;
  kitRef: React.RefObject<Record<string, SamplerWithFX>>;
  locSamples: SampleType[];
  kitSamples: SampleType[];
  setGenre: React.Dispatch<React.SetStateAction<Genre>>;
  genre: Genre;
  collection: string;
  setCollection: React.Dispatch<React.SetStateAction<string>>;
  loopIsPlaying: boolean;
  setLoopIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  allSampleData: Record<string, SampleType>;
  setAllSampleData: React.Dispatch<
    React.SetStateAction<Record<string, SampleType>>
  >;
  updateSamplerStateSettings: (
    id: string,
    settings: Partial<SampleSettings>
  ) => void;
  updateSamplerRefSettings: (id: string, key: string, value: number) => void;

  selectedSampleId: string | null;
  setSelectedSampleId: React.Dispatch<React.SetStateAction<string | null>>;
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
      id: `kit-1_${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Kick_Bulldog_2",
      label: "Kick",
      url: "/samples/drums/kicks/Kick_Bulldog_2.wav",
      events: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        quantize: false,
        quantVal: 4,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      id: `kit-2_${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Snare_Astral_1",
      label: "Snare",
      url: "/samples/drums/snares/Snare_Astral_1.wav",
      events: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        quantize: false,
        quantVal: 4,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      id: `kit-3_${getRandomNumberForId()}`,
      type: "drumKit",
      title: "ClosedHH_Alessya_DS",
      label: "HiHat",
      url: "/samples/drums/hats/ClosedHH_Alessya_DS.wav",
      events: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        quantize: false,
        quantVal: 4,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
    {
      id: `kit-4_${getRandomNumberForId()}`,
      type: "drumKit",
      title: "Clap_Graphite",
      label: "Clap",
      url: "/samples/drums/claps/Clap_Graphite.wav",
      events: [],
      settings: {
        volume: 0,
        pan: 0,
        pitch: 0,
        finetune: 0,
        attack: 0,
        release: 0,
        quantize: false,
        quantVal: 4,
        highpass: [0, "highpass"],
        lowpass: [20000, "lowpass"],
      },
    },
  ]);
  const [genre, setGenre] = useState<Genre>("jazz");
  const [collection, setCollection] = useState<string>(
    "Inventing Entertainment"
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loopIsPlaying, setLoopIsPlaying] = useState(false);
  const [masterGainLevel, setMasterGainLevel] = useState<number>(1);
  const masterGainNode = useRef<Tone.Gain>(
    new Tone.Gain(masterGainLevel).toDestination()
  );
  const [allSampleData, setAllSampleData] = useState<
    Record<string, SampleType>
  >({});
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

  // //testing things
  // useEffect(() => {
  //   console.log("selectedSampleId:", selectedSampleId);
  // }, [selectedSampleId]);

  //create samplers for library of congress samples
  useEffect(() => {
    if (locSamples.length > 0) {
      locSamples.forEach(({ id, url }) => {
        const name = id.split("_")[0];
        samplersRef.current[name] = makeSampler(id, url);
      });
    }
  }, [locSamples]);

  //create samplers for drum kit samples
  useEffect(() => {
    if (kitSamples.length > 0) {
      kitSamples.forEach(({ id, url }) => {
        const name = id.split("_")[0];
        samplersRef.current[name] = makeSampler(id, url);
      });
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

  // fetch samples using the collection
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const collectionArray = getCollectionArray(collection);
        if (!collectionArray) return;

        const selectedSamples = Array.from({ length: 8 }, () => {
          const index = Math.floor(Math.random() * collectionArray.length);
          return collectionArray[index];
        });
        const sampleSet: SampleType[] = Array.from(
          selectedSamples,
          (sample, index) => {
            const sampleData = {
              id: `loc-${index + 1}_${getRandomNumberForId()}`,
              type: `loc-${collection}`,
              title: getTitle(sample),
              label: getLabel(sample),
              url: sample,
              events: [],
              settings: {
                volume: 0,
                pan: 0,
                pitch: 0,
                finetune: 0,
                attack: 0,
                release: 0,
                quantize: false,
                quantVal: 4,
                highpass: [0, "highpass"],
                lowpass: [20000, "lowpass"],
              },
              attribution: "",
            };
            return sampleData;
          }
        );
        setLocSamples(sampleSet);
      } catch (error) {
        console.error("Error fetching samples:", error);
        // Set empty array on error to prevent null/undefined issues
        setLocSamples([]);
      }
    };

    fetchSamples();
  }, [collection]);

  // //fetch library of congress samples
  // useEffect(() => {
  //   const fetchSamples = async () => {
  //     try {
  //       const response = await fetch("/fileList.json");
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
  //       const result = await response.json();

  //       if (!result[genre]) {
  //         console.error("Genre not found in fileList.json:", genre);
  //         return;
  //       }

  //       const selectedSamples = await result[genre].slice(0, 8);
  //       if (selectedSamples) {
  //       }

  //       const sampleSet: SampleType[] = Array.from(
  //         selectedSamples,
  //         (sample, index) => {
  //           const sampleData = {
  //             id: `loc-${index + 1}_${getRandomNumberForId()}`,
  //             type: `loc-${genre}`,
  //             title: sample,
  //             label: sample.split(".")[0],
  //             url: `/samples/loc/${genre}/excerpts/${sample}`,
  //             events: [],
  //             settings: {
  //               volume: 0,
  //               pan: 0,
  //               pitch: 0,
  //               finetune: 0,
  //               attack: 0,
  //               release: 0,
  //               quantize: false,
  //               quantVal: 4,
  //               highpass: [0, "highpass"],
  //               lowpass: [20000, "lowpass"],
  //             },
  //             attribution: "",
  //           };
  //           return sampleData;
  //         }
  //       );
  //       setLocSamples(sampleSet);
  //     } catch (error) {
  //       console.error("Error fetching samples:", error);
  //       // Set empty array on error to prevent null/undefined issues
  //       setLocSamples([]);
  //     }
  //   };

  //   fetchSamples();
  // }, [genre]); // Dependency array ensures re-fetching when `genre` changes

  // initialize the allSampleData state with the locSamples and kitSamples
  useEffect(() => {
    setAllSampleData(() => {
      const sampleDataObj: Record<string, SampleType> = {};
      [...locSamples, ...kitSamples].forEach((sample) => {
        const name = sample.id.split("_")[0];
        sampleDataObj[name] = sample;
      });
      return sampleDataObj;
    });
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
    setAllSampleData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        settings: {
          ...prev[id].settings,
          ...settings,
        },
      },
    }));
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
        loopIsPlaying,
        setLoopIsPlaying,
        isRecording,
        setIsRecording,
        allSampleData,
        updateSamplerStateSettings,
        updateSamplerRefSettings,
        setAllSampleData,
        selectedSampleId,
        setSelectedSampleId,
        samplersRef,
        kitRef,
        genre,
        collection,
        setCollection,
      }}
    >
      {children}
    </AudioContextContext.Provider>
  );
};

export const useAudioContext = () => useContext(AudioContextContext);
