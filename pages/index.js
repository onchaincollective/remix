import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import cn from "classnames";
import { fabric } from "fabric";
import { saveAs } from 'file-saver';
import useEventListener from '@use-it/event-listener';


const contractAddress = "0x5a876ffc6e75066f5ca870e20fca4754c1efe91f";
const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });
const wcConnector = new WalletConnectConnector({
  infuraId: "6041be06ca6b4e848a530e495d66e45d",
});
let canvas;
const ESCAPE_KEYS = ['46', 'Delete', 'Backspace'];

export default function WrappedHome() {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
        <Home />
        </Web3ReactProvider>
    );
}

function getLibrary(provider) {
  return new Web3(provider);
}

function Home() {
  const { activate, active, account, library } = useWeb3React();
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState(true);
  const [bgImageSelected, setBgImageSelected] = useState(false);
  const [nftWithoutFlwrs, setNftWithoutFlwrs] = useState([]);
  const [nftFlwrs, setNftFlwrs] = useState([]);
  const [nftRenders, setNftRenders] = useState(null);
  const [emptyState, setEmptyState] = useState(true);

  useEventListener('keydown', handler);
  
  useEffect(() => {
    if (!library) return;

    console.log("Fetching details for account: ", account)

    setWorking(true);

    fetch("https://api.opensea.io/api/v1/assets?owner=" + account +"&order_direction=desc&offset=0&limit=50")
    .then(res => res.json())
    .then(
      (result) => {
        console.log(result);
        let nftArray = result.assets;
        let nftArrayFlwrs = nftArray.filter((nft) => {
          return nft.asset_contract.address === contractAddress;
        });
        let nftArrayWithoutFlwrs = nftArray.filter((nft) => {
          return nft.asset_contract.address !== contractAddress;
        });
        setNftWithoutFlwrs(nftArrayWithoutFlwrs);
        setNftFlwrs(nftArrayFlwrs);
        setWorking(false);

        // Initiating fabric canvas
        setNftImages(nftArrayWithoutFlwrs, true);
        canvas = new fabric.Canvas("c");
      },
      (error) => {
        setWorking(false);
        console.log("Oops, there was an error while fetching your jpegs", error);
      }
    )
  }, [account]);

  useEffect(() => {
    if (nftRenders && nftRenders.length > 0) {
      setEmptyState(false);
    }
  }, [nftRenders])

    // Method to set URLs for nfts in selection view
  function setNftImages(nftArray, bgImage) {
    let nftRendersMap = nftArray.map((nft, i) =>
      <img 
        src={nft.image_url} 
        key={i}
        className="cursor-pointer w-full rounded-lg"
        onClick={() => loadFile(nft.image_url, bgImage)}
        />
    );
    setNftRenders(nftRendersMap);
  }

  // Keyboard event handler method
  function handler({ key }) {
    console.log(key);
    if (ESCAPE_KEYS.includes(String(key))) {
      deleteSelectedObjectsFromCanvas();
    }
  }

  // Utility method to delete selected objects from canvas
  function deleteSelectedObjectsFromCanvas(){
    var selection = canvas.getActiveObject();
    if (selection.type === 'activeSelection') {
      selection.forEachObject(function(element) {
        console.log(element);
        canvas.remove(element);
      });
    }
    else{
      canvas.remove(selection);
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
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

  // Method to download remixed pfp
  function downloadPFP() {
    canvas.discardActiveObject().renderAll();
    canvas.getElement().toBlob(function(blob) {
      saveAs(blob, "occ_flowers_remix.jpeg");
    });
  }

  // Method to show only flower nfts
  function refreshNfts() {
    console.log('refreshing nfts');
    setBgImage(false);
    setNftRenders(null);
    // setNftImages([], false);
    setNftImages(nftFlwrs, false);
  }

  // Method to reset to first step
  function goToBaseStep() {
    setBgImage(true);
    setBgImageSelected(false);
    setNftRenders(null);
    setNftImages(nftWithoutFlwrs, true);
    canvas.setDimensions({width: 500, height: 500});
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
              img.scaleToWidth(500);
              canvas.setDimensions({width: 500, height: img.getScaledHeight()});
              canvas.setBackgroundImage(img);
              canvas.renderAll();
            });
        } else if (fileType === 'image/svg+xml') { //check if svg
          fabric.loadSVGFromURL(url, function(objects, options) {
            var svg = fabric.util.groupSVGElements(objects, options);
            svg.scaleToWidth(500);
            canvas.setDimensions({width: 500, height: svg.getScaledHeight()});
            canvas.setBackgroundImage(svg);
            canvas.renderAll();
          });
        }
        setBgImageSelected(true);
      } else {
        console.log('adding flowers');
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
          let parser = new DOMParser();
          let xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
          if (xmlDoc.getElementsByTagName("svg").length > 0) {
            xmlDoc.getElementsByTagName("svg")[0].setAttribute('width', 500);
            xmlDoc.getElementsByTagName("svg")[0].setAttribute('viewBox', "100 100 300 300");
            
            let y1 = xmlDoc.getElementsByTagName("rect")[0];

            if (y1.getAttribute('filter') == "url(#filterBG)") {
              let bg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" height="500" width="500">'
                  + (new XMLSerializer()).serializeToString(y1) 
                  + '</svg>';
              
              bg = parser.parseFromString(bg, "text/xml");
      
              fabric.Image.fromURL("data:image/svg+xml;base64," + base64(bg), function(img) {
                let img3 = img.set({left: 0,top: 0, lockMovementX: true, lockMovementY: true, selectable: false, opacity: 0.5, mode: 'overlay'  })
                img3.scaleToWidth(500);
                canvas.add(img3);
                canvas.renderAll();
              }, { crossOrigin: 'Anonymous' });
            }
            let y2 = xmlDoc.getElementsByTagName("rect")[1];
            xmlDoc.documentElement.removeChild(y1);
            xmlDoc.documentElement.removeChild(y2);
          }

          fabric.Image.fromURL("data:image/svg+xml;base64," + base64(xmlDoc), function(img) {
            let img3 = img.set({left: 100,top: 100})
            img3.scaleToWidth(300);
            canvas.add(img3);
            canvas.renderAll();
          },{ crossOrigin: 'Anonymous' });
        };
      }
    }).catch(error => {
      console.log("There was an error loading the image :(", error);
    })
  }
  
  return (
    <main className="occ-home">
        <Head>
            <title>the Remix by OCC</title>
            <meta name="title" content="the Remix by OCC"/>
            <meta name="description" content="Create pfps by remixing your existing NFTs and adding flowers you own"/>

            <meta property="og:type" content="website"/>
            <meta property="og:url" content="https://www.occ.xyz/flowers/remix"/>
            <meta property="og:title" content="the Remix by OCC"/>
            <meta property="og:description" content="Create pfps by remixing your existing NFTs and adding flowers you own"/>
            <meta property="og:image" content="https://www.occ.xyz/flowers/social_image.png"/>

            <meta property="twitter:card" content="summary_large_image"/>
            <meta property="twitter:url" content="https://www.occ.xyz/flowers/remix"/>
            <meta property="twitter:title" content="the Remix by OCC"/>
            <meta property="twitter:description" content="Create pfps by remixing your existing NFTs and adding flowers you own"/>
            <meta property="twitter:image" content="https://www.occ.xyz/flowers/social_image.png"/>
            <link rel="icon" href="/remix/favicon.ico" sizes="any" />
            <link rel="icon" href="/remix/icon.png" type="image/png" />
            <link rel="apple-touch-icon" href="/remix/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.webmanifest" />
        </Head>
      
        <div className="flex items-center flex-col max-w-5xl mx-auto text-center">
          <header className="text-5xl md:text-6xl font-snell flex items-center justify-center mt-6">
            <img src="/remix/logo.png" className="w-2/6"/>
          </header>
          <div className="flex flex-row space-between items-center align-center -mt-8 w-full">
           {!active &&
              <div className="flex flex-col max-w-xl mx-auto">
                <p className="text-center max-w-xl mx-auto text-2xl text-left  md:p-4 p-6">
                  Flaunt your flowers by remixing with jpegs you own. Connect your wallet to get started
                </p>
                <div className="flex align-center flex-col max-w-4xl mx-auto text-xl text-left mt-6 pb-4">
                    <ConnectButtons setWorking={setWorking} activate={activate} />
                </div>
                <div className="flex flex-row space-x-8 mt-8 items-center justify-center">
                  <img src="/remix/pfpflip.gif" className="rounded-xl w-96"/>
                  <img src="/remix/flowerflip.gif" className="rounded-xl w-96"/>
                </div>
              </div>
            }
            {active && working &&
              <p className="text-center max-w-xl mx-auto text-2xl text-left md:p-4 p-6 mb-24">
                Loading your jpegs
              </p>
            }
            {active && !working &&
              <>
                {nftWithoutFlwrs.length > 0 ?
                  <>
                    <div className="ghost-button back-button" onClick={() => goToBaseStep()}>{!bgImage  && <span><span className="arrow-left"/> back</span>}</div>
                    <p className="text-center max-w-xl mx-auto text-2xl text-left  md:p-4 p-6">
                      {bgImage ? "Choose your base jpeg" : "Now add all the flowers you want to your pfp"}
                    </p>
                    {bgImage ?
                      <button className="ghost-button disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => refreshNfts()}  disabled={!bgImageSelected}>next</button>
                      :
                      <div className={nftFlwrs.length > 0 ? "button" : "ghost-button"} onClick={() => downloadPFP()}>download jpeg</div>
                    }
                  </>
                  :
                  <div className="flex flex-col max-w-xl mx-auto text-2xl text-left md:p-4 p-6">
                    <p className="text-center">
                      {nftFlwrs.length > 0 ?
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
                    <div className="flex flex-row space-x-8 mt-8 items-center justify-center">
                      <img src="/remix/pfpflip.gif" className="rounded-xl w-96"/>
                      <img src="/remix/flowerflip.gif" className="rounded-xl w-96"/>
                    </div>
                  </div>
                }
              </>
            }
          </div>
        </div>
        {active && !working && nftWithoutFlwrs.length > 0&& 
          <div className="flex flex-row space-x-8 mx-auto items-start text-center mt-12 mb-12 max-w-5xl">
            <div>
              <img id="output" crossOrigin="anonymous" className="hidden"/>
              <canvas id="c" width="500" height="500" crossOrigin="anonymous"></canvas>
              <div id="svg-tag" crossOrigin="anonymous"></div>
            </div>
            <div className="felx flex-col items-center w-full h-full justify-center">
              {nftRenders && nftRenders.length > 0 ?
              <div className="grid grid-cols-4 gap-4 nfts"> 
                {nftRenders}
              </div>
              :
              <div className="flex items-center flex-col justify-center p-16">
                <p className="text-lg">
                🥀 No flowers found in your wallet 🥀
                </p>
                <a href="https://opensea.io/collection/flowersonchain" target="_blank" className="ghost-button mt-8">get from opensea</a>
              </div>
              }
            </div>
          </div>
        }
        <div className="flex align-center flex-col max-w-2xl mx-auto text-center mt-8 mb-8 p-4">
          <div className="text-md ">
            <a href="https://occ.xyz/flowers" target="_blank" className="hover:underline">
              flowers
            </a>
            {" "}&bull;{" "}
            <a href="https://twitter.com/OnChainCo" target="_blank" className="hover:underline">
              twitter
            </a>
            {" "}&bull;{" "}
            <a href="https://discord.com/invite/BUCup66VKc" target="_blank" className="hover:underline">
              discord
            </a>
          </div>
        </div>
    </main>
  );
}


function ConnectButtons({ activate, setWorking }) {
  const cls =
    "btn rounded-full flex justify-center space-x-2 images-center shadow-md border-2 w-52 h-14 text-base font-normal m-2";
  return (
    <>
      {/* <h3>Connect your wallet</h3> */}
      <div className="flex flex-col md:flex-row items-center justify-center">
        <button
          onClick={() => {
            setWorking(true);
            activate(injected);
          }}
          className={cn(cls, "text-yellow-600 border-yellow-600")}
        >
          <img src="/remix/metamask-fox.svg" className="h-5 w-5" />
          <span className="roboto">Metamask</span>
        </button>
        <button
          onClick={() => {
            setWorking(true);
            activate(wcConnector);
          }}
          className={cn(cls, "text-blue-500 border-blue-600")}
        >
          <img src="/remix/walletconnect-logo.svg" className="h-5 w-5" />
          <span className="roboto">WalletConnect</span>
        </button>
      </div>
    </>
  );
}

