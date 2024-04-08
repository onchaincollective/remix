'use client'

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { FabricJSCanvas } from 'fabricjs-react'
import { saveAs } from 'file-saver';
import { useAccount } from 'wagmi'
import Image from "next/image";
import ConnectButton from "./connectButton";
import useEventListener from '@use-it/event-listener';

// global variables
const contractAddress = "0x5a876ffc6e75066f5ca870e20fca4754c1efe91f";
let canvas;
const ESCAPE_KEYS = ['46', 'Delete', 'Backspace'];
const apiLimit = 50;
let jpegArray = [];


export default function Home() {
  const { address } = useAccount()
  const [working, setWorking] = useState(true);
  const [bgImage, setBgImage] = useState(true);
  const [bgImageSelected, setBgImageSelected] = useState(false);
  const [jpegWithoutFlwrs, setJpegWithoutFlwrs] = useState([]);
  const [jpegFlwrs, setJpegFlwrs] = useState([]);
  const [jpegRenders, setJpegRenders] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [screenWidth, setScreenWidth] = useState(500);

  // Hook for keydown press
  useEventListener('keydown', handler);

  // Setting screen width and height to be used in canvas
  useEffect(() => {
    if (screen.width < 480) {
      setScreenWidth(screen.width);
    } else {
      setScreenWidth(500);
    }
  }, []);

  // onReady trigger for dom canvas to init fabric canvas
  const onCanvasReady = (fabricCanvas) => {
    console.log("Canvas is ready:", fabricCanvas);
    canvas = fabricCanvas;
    // Set the canvas dimensions
    canvas.setDimensions({ width: screenWidth, height: screenWidth });
  };

  // Hook to fetch jpegs when wallet is connected
  useEffect(() => {
    if (!address) return; 
    console.log("Fetching details for account: ", address);
    setWorking(true);
    fetchNfts(nextCursor)
  }, [address]);

  // Fetch jpegs from OpenSea
  function fetchNfts(nextCursor) {
    fetch("https://api.opensea.io/api/v2/chain/ethereum/account/" + address +"/nfts?limit=" + apiLimit + "&next="+ nextCursor, {
      headers: {
        'X-API-KEY': process.env.NEXT_PUBLIC_OPENSEA_API_KEY, // API key
      }
    })
    .then(res => res.json())
    .then(
      (result) => {
        jpegArray.push(...result.nfts)
        setNextCursor(result.next);
        if (result.next) {
          fetchNfts(result.next);
        } else {
          let nftArrayFlwrs = jpegArray.filter((nft) => {
            return nft.contract === contractAddress;
          });
          let nftArrayWithoutFlwrs = jpegArray.filter((nft) => {
            return nft.contract !== contractAddress;
          });
          setJpegWithoutFlwrs(nftArrayWithoutFlwrs);
          setJpegFlwrs(nftArrayFlwrs);
          setWorking(false);
          setNftImages(nftArrayWithoutFlwrs, true);
        }
      },
      (error) => {
        setWorking(false);
        console.log("Oops, there was an error while fetching your jpegs", error);
      }
    )    
  }

  // Utility function to set w and h for svg
  const convertImage = (w, h) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect width="${w}" height="${h}" rx="20">
      <animate attributeName="fill" values="#2C2C2C;#3D3D3D;#2C2C2C" dur="1s" repeatCount="indefinite" />
    </rect>
  </svg>`;

  // Utility function to convert to base64
  const toBase64 = (str) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  // Method to set URLs for nfts in selection view
  function setNftImages(nftArray, bgImage) {
    let nftRendersMap = [];
    nftRendersMap = nftArray.map((nft, i) =>
      <div className="flex" key={i}>
        <Image
          unoptimized
          src={nft.image_url ? nft.image_url : "https://res.cloudinary.com/ds24tivvl/image/upload/v1647866100/remix/404.png"}
          alt="NFT"
          width={150}
          height={150}
          className="cursor-pointer rounded-lg nft"
          onClick={() => loadFile(nft.image_url ? nft.image_url : "https://res.cloudinary.com/ds24tivvl/image/upload/v1647866100/remix/404.png", bgImage)}
          blurDataURL={`data:image/svg+xml;base64,${toBase64(
            convertImage(150, 150)
          )}`}
          placeholder="blur" // Optional blur-up while loading
        />
      </div>
    );
    setJpegRenders(nftRendersMap);
  }

  // Utility method to return base64 string
  function base64(str) {
    return window.btoa((new XMLSerializer()).serializeToString(str))
  } 

  // Utility method to get inputstream from a url
  async function getFileFromUrl(url, name, defaultType = 'image/jpeg'){
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], name, {
      type: response.headers.get('content-type') || defaultType,
    });
  }

  // Keyboard event handler method
  function handler({ key }) {
    if (ESCAPE_KEYS.includes(String(key))) {
      deleteSelectedObjectsFromCanvas();
    }
  }

  // Utility method to delete selected objects from canvas
  function deleteSelectedObjectsFromCanvas(){
    var selection = canvas.getActiveObject();
    if (selection.type === 'activeSelection') {
      selection.forEachObject(function(element) {
        canvas.remove(element);
      });
    }
    else{
      canvas.remove(selection);
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  // Method to download remixed pfp
  function downloadPFP() {
    canvas.discardActiveObject().renderAll();
    canvas.getElement().toBlob(function(blob) {
      saveAs(blob, "occ_flowers_remix");
    });
  }

  // Method to show only flower nfts
  function refreshNfts() {
    console.log('refreshing nfts');
    setBgImage(false);
    setJpegRenders([]);
    let santaHat = [
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640094508/Santa-hat/santahat2.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640094508/Santa-hat/santahat3.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640094508/Santa-hat/santahat4.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640094508/Santa-hat/santahat5.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640089027/Santa-hat/santahat6.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640089027/Santa-hat/santahat7.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640089027/Santa-hat/santahat8.png'}, 
      {image_url: 'https://res.cloudinary.com/ds24tivvl/image/upload/v1640089027/Santa-hat/santahat10.png'}];
    let flwrsWithSantaHat = jpegFlwrs.concat(santaHat);
    setNftImages(flwrsWithSantaHat, false);
  }

  // Method to reset to first step
  function goToBaseStep() {
    setBgImage(true);
    setBgImageSelected(false);
    setJpegRenders([]);
    setNftImages(jpegWithoutFlwrs, true);
    canvas.setDimensions({width: screenWidth, height: 500});
    canvas.clear();
  }

  /* Method to load the selected image onto the canvas
  ** url: link for the image to be loaded onto the canvas
  ** bgImage: boolean to set the image as base layer (first layer)
  **/
  function loadFile(url, bgImage) {
    let output = document.getElementById("output");
    output.src = url;
    getFileFromUrl(url, 'nft.jpg').then((file) => {
      if (bgImage) {
        console.log('setting bgimg');
        let fileType = file.type;
        let url = URL.createObjectURL(file);
        if (fileType === 'image/png' || fileType === 'image/jpg' || fileType === 'image/jpeg' || fileType === 'image/gif') { //check if img
          fabric.Image.fromURL(url, function(img) {
            img.scaleToWidth(screenWidth);
            canvas.setDimensions({width: screenWidth, height: img.getScaledHeight()});
            canvas.setBackgroundImage(img);
            canvas.renderAll();
          }, { crossOrigin: 'Anonymous' });
        } else if (fileType === 'image/svg+xml') { //check if svg
          let reader = new FileReader();
          reader.readAsText(file, "UTF-8");
          reader.onload = function (evt) {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
            if (xmlDoc.getElementsByTagName("svg").length > 0) {
              xmlDoc.getElementsByTagName("svg")[0].setAttribute('width', 500);
            }
            fabric.Image.fromURL("data:image/svg+xml;base64," + base64(xmlDoc), function(img) {
              let img3 = img.set({left: 0,top: 0, lockMovementX: true, lockMovementY: true, selectable: false, mode: 'overlay'  })
              img3.scaleToWidth(screenWidth);
              canvas.setDimensions({width: screenWidth, height: img.getScaledHeight()});
              canvas.setBackgroundImage(img);
              canvas.renderAll();
            }, { crossOrigin: 'Anonymous' });
          }
        }
        setBgImageSelected(true);
      } else {
        console.log('adding flowers or santa caps');
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
          let parser = new DOMParser();
          let xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
          if (xmlDoc.getElementsByTagName("svg").length > 0) {
            console.log(xmlDoc);
            xmlDoc.getElementsByTagName("svg")[0].setAttribute('width', 500);
            xmlDoc.getElementsByTagName("svg")[0].setAttribute('height', 500);
            xmlDoc.getElementsByTagName("svg")[0].setAttribute('viewBox', "100 100 300 300");
            
            let y1 = xmlDoc.getElementsByTagName("rect")[0];

            // if (y1.getAttribute('filter') == "url(#filterBG)") {
            //   let bg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" height="500" width="500">'
            //       + (new XMLSerializer()).serializeToString(y1) 
            //       + '</svg>';
              
            //   bg = parser.parseFromString(bg, "text/xml");
      
            //   fabric.Image.fromURL("data:image/svg+xml;base64," + base64(bg), function(img) {
            //     let img3 = img.set({left: 0,top: 0, lockMovementX: true, lockMovementY: true, selectable: false, opacity: 0.5, mode: 'overlay'  })
            //     img3.scaleToWidth(500);
            //     canvas.add(img3);
            //     canvas.renderAll();
            //   }, { crossOrigin: 'Anonymous' });
            // }
            let y2 = xmlDoc.getElementsByTagName("rect")[1];
            xmlDoc.documentElement.removeChild(y1);
            xmlDoc.documentElement.removeChild(y2);

            fabric.Image.fromURL("data:image/svg+xml;base64," + base64(xmlDoc), function(img) {
              let img3 = img.set({left: 100,top: 100})
              img3.scaleToWidth(300);
              canvas.add(img3);
              canvas.renderAll();
            },{ crossOrigin: 'Anonymous' });
          } else {
            let url = URL.createObjectURL(file);
            fabric.Image.fromURL(url, function(img) {
              let img3 = img.set({left: 100,top: 100})
              img3.scaleToWidth(300);
              canvas.add(img3);
              canvas.renderAll();
            }, { crossOrigin: 'Anonymous' });
          }
        };
      }
    }).catch(error => {
      console.log("There was an error loading the image :(", error);
    })
  }

  const CanvasActions = () => {
    return (
      working ?
      <p className="text-center max-w-xl mx-auto text-2xl md:p-4 p-6 mb-24">
        Loading your jpegs
      </p>
      :
      <>
        {jpegWithoutFlwrs.length > 0 ?
          <>
            <div className={bgImage ? "cursor-not-allowed back-button" : "ghost-button back-button"}
              onClick={() => goToBaseStep()}>{!bgImage  && <span><span className="arrow-left"/> back</span>}</div>
            <p className="text-center max-w-xl mx-auto text-md sm:text-2xl md:p-4 p-6">
              {bgImage ? "Choose your base jpeg" : "Now add flowers you own or santa hats to your pfp"}
            </p>
            {bgImage ?
              <button className={bgImageSelected ? "button" : "ghost-button"}
                onClick={() => refreshNfts()}  disabled={!bgImageSelected}>next</button>
              :
              <div className={jpegFlwrs.length > 0 ? "button" : "ghost-button"} onClick={() => downloadPFP()}>download</div>
            }
          </>
          :
          <div className="flex flex-col max-w-xl mx-auto text-2xl text-left md:p-4 p-6">
            <p className="text-center">
              {jpegFlwrs.length > 0 ?
                <span>
                  Looks like you don't have any jpegs other than flowers in your wallet to remix.
                  Get some now on <a href="https://opensea.io" target="_blank" className="hover:underline italic">opensea</a>
                </span> :
                <span>
                  Looks like you don't have any jpegs in your wallet.
                  Get some now on <a href="https://opensea.io" target="_blank" className="hover:underline italic">opensea</a>
                </span>
              }
            </p>
            <FlipImages />
          </div>
        }
      </>
    )
  }

  const FlipImages = () => (
    <div className="flex flex-row space-x-6 md:space-x-8 mt-8 items-center justify-center">
      <div className="flex">
        <Image
          src="/pfpflip.gif"
          alt="PFP flip"
          width={500}
          height={500}
          className="rounded-xl"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(convertImage(150, 150))}`}
          placeholder="blur"
        />
      </div>
      <div className="flex">
        <Image
          src="/flowerflip.gif"
          alt="Flower flip"
          width={500}
          height={500}
          className="rounded-xl"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(convertImage(150, 150))}`}
          placeholder="blur"
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center flex-col max-w-5xl mx-auto text-center">
        <header className="text-5xl md:text-6xl font-snell flex items-center justify-center mt-6">
          <img src="/logo.png" className="w-5/6 sm:w-2/6"/>
        </header>
        <div className="flex flex-row space-between items-center align-center -mt-8 w-full">
          {!address ? (
            <div className="flex flex-col max-w-xl mx-auto">
              <p className="text-center max-w-xl mx-auto text-2xl md:p-4 p-6">
                Add flowers and santa caps to your jpegs. <br/> Connect your wallet to get started
              </p>
              <div className="flex align-center flex-col max-w-4xl mx-auto text-xl text-left mt-6 pb-4">
                <ConnectButton />
              </div>
              <FlipImages />
            </div>
          ) : (
            <CanvasActions />
          )}
        </div>
      </div>
      {!working && jpegWithoutFlwrs.length > 0 && 
        <div className="flex flex-col md:flex-row mx-auto items-start text-center mt-12 mb-12 max-w-5xl">
          <div className="w-full">
            <img id="output" crossOrigin="anonymous" className="hidden"/>
            <div className="canvas">
              <FabricJSCanvas onReady={onCanvasReady} width={screenWidth} height={screenWidth} />
            </div>
            <div id="svg-tag" crossOrigin="anonymous"></div>
          </div>
          <div className="felx flex-col items-center sm:ml-8 mt-24 sm:mt-0 w-full h-full justify-center nft-container">
            {jpegRenders && jpegRenders.length > 0 ?
              <div className="grid grid-cols-4 gap-4 nfts"> 
                {jpegRenders}
              </div>
              :
              <div className="flex items-center flex-col justify-center p-16">
                <p className="text-lg">
                🥀 No flowers found in your wallet 🥀
                </p>
                <a href="https://opensea.io/collection/flowersonchain" target="_blank" className="ghost-button mt-8">get from opensea</a>
              </div>
            }
            <div className="bottom-fade"></div>
          </div>
        </div>
      }
    </>
  )
}