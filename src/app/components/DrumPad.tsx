"use client";
import { use, useEffect, useState } from "react";
import { useAudioContext } from "../contexts/AudioContext";
import * as Tone from "tone";
import quantize from "../functions/quantize";
import { SampleType } from "../types/SampleType";

type DrumPadProps = {
  id: string;
  sampler: Tone.Sampler;
};

const DrumPad: React.FC<DrumPadProps> = ({ id, sampler }) => {
  // const audioCtx = useAudioContext();
  // if (!audioCtx) return null;

  const {
    transport,
    isRecording,
    isPlaying,
    quantizeValue,
    quantizeActive,
    // getSampleData,
    allSampleData,
    setAllSampleData,
    setSelectedSampleId,
    selectedSampleId,
    q,
  } = useAudioContext();

  const [sampleData, setSampleData] = useState<SampleType | null>(
    allSampleData[selectedSampleId]?.sampleData
  );
  const [isSelected, setIsSelected] = useState(false);

  //test some things
  useEffect(() => {
    console.log("sample data", sampleData);
    console.log("all sample data at id", allSampleData[selectedSampleId]);
  }, [sampleData, allSampleData, selectedSampleId]);

  // // Load sample data
  // useEffect(() => {
  //   if (!selectedSampleId) return;

  //   setSampleData(allSampleData[selectedSampleId]?.sampleData || null);
  // });

  // Schedule playback of sampleData
  useEffect(() => {
    if (
      !isPlaying ||
      !sampleData ||
      sampleData.times.length === 0 ||
      !sampleData.times[sampleData.times.length - 1].duration
    )
      return;

    const bpm = transport.current.bpm.value;

    const events = sampleData?.times.map((event) => {
      const eventTime = quantizeActive
        ? quantize(event.startTime, bpm, quantizeValue)
        : event.startTime;

      return [
        eventTime,
        {
          startTime: eventTime,
          duration: event.duration,
        },
      ];
    });

    const part = new Tone.Part((time, event) => {
      sampler.triggerAttackRelease("C4", event.duration, time);
    }, events);

    part.start(0);

    const disposePart = () => {
      if (part) {
        try {
          if (part.state === "started") {
            part.stop();
          }
          part.dispose();
        } catch (error) {
          console.warn("Error disposing part:", error);
        }
      }
    };

    return () => {
      disposePart();
    };
  }, [
    isPlaying,
    sampleData,
    quantizeActive,
    quantizeValue,
    sampler,
    transport,
  ]);

  // Sync isSelected state with selectedSampleId
  useEffect(() => {
    setIsSelected(selectedSampleId === id);
  }, [selectedSampleId, id]);

  // // Update allSampleData with sampleData
  // useEffect(() => {
  //   if (!selectedSampleId) return;

  //   setAllSampleData((prev) => {
  //     const existingIndex = prev.findIndex((item) => item.id === sampleData.id);
  //     if (existingIndex !== -1) {
  //       const updatedData = [...prev];
  //       updatedData[existingIndex] = sampleData;
  //       return updatedData;
  //     } else {
  //       return [...prev, sampleData];
  //     }
  //   });
  // }, [sampleData, setAllSampleData]);

  // Update allSampleData with sampleData
  useEffect(() => {
    if (!selectedSampleId) return;

    setAllSampleData((prev) => ({
      ...prev,
      [selectedSampleId]: { ...prev[selectedSampleId], sampleData },
    }));
  }, [selectedSampleId, sampleData, setAllSampleData]);

  // useEffect(() => {
  //   if (
  //     !allSampleData[selectedSampleId] ||
  //     allSampleData[selectedSampleId] === sampleData
  //   )
  //     return;

  //   const handler = setTimeout(() => {
  //     // Update global state
  //     setAllSampleData((prev) => ({
  //       ...prev,
  //       [selectedSampleId]: { ...prev[selectedSampleId], sampleData },
  //     }));

  //     console.log("all sample data", allSampleData);
  //   }, 500);

  //   return () => {
  //     clearTimeout(handler); // cancel if settings change before debounceDelay
  //   };
  // }, [allSampleData, sampleData, setAllSampleData]);

  const handlePressPad = () => {
    sampler.triggerAttack("C4");
    setSelectedSampleId(id);
    setIsSelected(true);

    if (isPlaying && isRecording) {
      const startTime = transport.current.seconds;

      setSampleData((prevData) => ({
        ...prevData,
        times: [...(prevData?.times || []), { startTime, duration: 0 }],
      }));
    }
  };

  const handleReleasePad = () => {
    const releaseTime = transport.current.seconds;
    sampler.triggerRelease("C4");

    if (isRecording && isPlaying && sampleData) {
      setSampleData((prevData) => {
        const updatedTimes = prevData?.times.map((time, idx, arr) => {
          if (
            idx === arr.length - 1 &&
            time.duration === 0 &&
            releaseTime > time.startTime
          ) {
            return { ...time, duration: releaseTime - time.startTime };
          }
          return time;
        });

        return {
          ...prevData,
          times: updatedTimes,
        };
      });
    }
  };

  return (
    <div
      className={`${isSelected ? "border-2 border-blue-600" : "border-2 border-transparent"} rounded-sm`}
    >
      <button
        onMouseDown={handlePressPad}
        onTouchStart={handlePressPad}
        onMouseUp={handleReleasePad}
        onMouseLeave={handleReleasePad}
        onTouchEnd={handleReleasePad}
        className="m-1 bg-slate-400 border border-slate-800 rounded-sm focus:border-double w-20 h-20 active:bg-slate-500 shadow-md shadow-slate-700"
      >
        {id}
      </button>
    </div>
  );
};

export default DrumPad;
