import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import cn from "classnames";
import { fabric } from "fabric";
import { saveAs } from 'file-saver';


const contractAddress = "0x5a876ffc6e75066f5ca870e20fca4754c1efe91f";

const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });
const wcConnector = new WalletConnectConnector({
  infuraId: "6041be06ca6b4e848a530e495d66e45d",
});

function getLibrary(provider) {
  return new Web3(provider);
}

let canvas;

export default function WrappedHome() {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
        <Home />
        </Web3ReactProvider>
    );
}

function Home() {
    const { activate, active, account, library } = useWeb3React();
    const [working, setWorking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bgImage, setBgImage] = useState(true);
    const [nftWithoutFlwrs, setNftWithoutFlwrs] = useState(null);
    const [nftFlwrs, setNftFlwrs] = useState(null);
    const [nftRenders, setNftRenders] = useState(null)
    
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
            setNftWithoutFlwrs(result.assets);
            setWorking(false);
            setNftImages(nftArrayWithoutFlwrs, true);
            canvas = new fabric.Canvas("c");
          },
          (error) => {
            setWorking(false);
          }
        )
        
    }, [account]);

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


    function base64(str) {
      return window.btoa((new XMLSerializer()).serializeToString(str))
    } 

    async function getFileFromUrl(url, name, defaultType = 'image/jpeg'){
      const response = await fetch(url);
      const data = await response.blob();
      return new File([data], name, {
        type: response.headers.get('content-type') || defaultType,
      });
    }

    function loadFile(url, bgImage) {
      var output = document.getElementById("output");
      output.src = url;

      if (bgImage) {
        console.log('setting bgimg');
        fabric.Image.fromURL(output.src, function(img) {
          var img3 = img.set({left: 0,top: 0 })
          img3.scaleToWidth(500);
          canvas.setDimensions({width: 500, height: img3.getScaledHeight()});
          canvas.setBackgroundImage(img3);
          canvas.renderAll();
        }, { crossOrigin: 'Anonymous' });
      } else {
        console.log('adding flowers');
        getFileFromUrl(url, 'example.jpg').then((file) => {
          var reader = new FileReader();
          reader.readAsText(file, "UTF-8");
          reader.onload = function (evt) {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
            if (xmlDoc.getElementsByTagName("svg").length > 0) {
              xmlDoc.getElementsByTagName("svg")[0].setAttribute('width', 500);
              xmlDoc.getElementsByTagName("svg")[0].setAttribute('viewBox', "100 100 300 300");
              
              var y1 = xmlDoc.getElementsByTagName("rect")[0];
              if (y1.getAttribute('filter') == "url(#filterBG)") {
                let bg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" height="500" width="500">'
                    + (new XMLSerializer()).serializeToString(y1) 
                    + '</svg>';
                
                bg = parser.parseFromString(bg, "text/xml");
        
                fabric.Image.fromURL("data:image/svg+xml;base64," + base64(bg), function(img) {
                  var img3 = img.set({left: 0,top: 0, lockMovementX: true, lockMovementY: true, selectable: false, opacity: 0.5, mode: 'overlay'  })
                  img3.scaleToWidth(500);
                  canvas.add(img3);
                  canvas.renderAll();
                }, { crossOrigin: 'Anonymous' });
              }
              var y2 = xmlDoc.getElementsByTagName("rect")[1];
              xmlDoc.documentElement.removeChild(y1);
              xmlDoc.documentElement.removeChild(y2);
            }

            fabric.Image.fromURL("data:image/svg+xml;base64," + base64(xmlDoc), function(img) {
              var img3 = img.set({left: 100,top: 100})
              img3.scaleToWidth(300);
              canvas.add(img3);
              canvas.renderAll();
            },{ crossOrigin: 'Anonymous' });

          };
        }).catch(error => {
          console.log("There was an error loading the imgage :(", error);
        });
      }
    }

    function downloadPFP() {
      canvas.discardActiveObject().renderAll();
      canvas.getElement().toBlob(function(blob) {
        saveAs(blob, "pfp.png");
      });
    }

    function refreshNfts() {
      console.log('refreshing nfts');
      setNftRenders(null);
      setNftImages(nftFlwrs, false);
    }
    

  return (
    <main className="occ-home">
        <Head>
            <title>Flowers • OCC #1</title>
            <meta name="title" content="NFT Remix • OCC #1"/>
            <meta name="description" content="Connect your wallet to create pfp remixes from your NFTs"/>

            <meta property="og:type" content="website"/>
            <meta property="og:url" content="https://www.occ.xyz/flowers"/>
            <meta property="og:title" content="Flowers • OCC #1"/>
            <meta property="og:description" content="Connect your wallet to create pfp remixes from your NFTs"/>
            <meta property="og:image" content="https://www.occ.xyz/flowers/social_image.png"/>

            <meta property="twitter:card" content="summary_large_image"/>
            <meta property="twitter:url" content="https://www.occ.xyz/flowers"/>
            <meta property="twitter:title" content="Flowers • OCC #1"/>
            <meta property="twitter:description" content="Connect your wallet to create pfp remixes from your NFTs"/>
            <meta property="twitter:image" content="https://www.occ.xyz/flowers/social_image.png"/>
            <link rel="icon" href="/flowers/favicon.ico" sizes="any" />
            <link rel="icon" href="/flowers/icon.png" type="image/png" />
            <link rel="apple-touch-icon" href="/flowers/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.webmanifest" />
        </Head>
      
        <div className="flex items-center flex-col max-w-2xl mx-auto text-center p-4">
          <div className="mt-6 md:mt-10 flex flex-col items-center">
              <header className="text-5xl md:text-6xl font-snell ml-8">
                  flowers
              </header>

              <p className="text-center max-w-3xl mx-auto text-xl text-left mt-2 md:p-4 p-6">
                Connect your wallet to create pfp remixes from your NFTs
              </p>
          </div>
          {!active && (
              <div className="flex align-center flex-col max-w-4xl mx-auto text-xl text-left mt-8 pb-4">
                  <ConnectButtons setWorking={setWorking} activate={activate} />
              </div>
          )}
          {active && working && (
              <div className="flex align-center flex-col max-w-4xl mx-auto text-xl text-left mt-8 pb-4">
                  Loading your nfts
              </div>
          )}
        </div>
        {active && !working && (
          <div className="flex flex-col mx-auto text-center mt-10 mb-12 max-w-5xl">
            <div className="flex flex-row space-x-8 ">
              <div className="">
                <img id="output" crossOrigin="anonymous" className="hidden"/>
                <canvas id="c" width="500" height="500" crossOrigin="anonymous"></canvas>
                <div className="button cursor-pointer p-4 mt-8" hidden={bgImage} onClick={() => downloadPFP()}>Download</div>
                <div id="svg-tag" crossOrigin="anonymous"></div>
              </div>
              <div className="felx flex-col items-center justify-center">
                <div className="grid grid-cols-4 gap-4 nfts"> 
                  {nftRenders}
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-center space-x-8">
              <div className="button cursor-pointer py-4 mt-8" onClick={() => downloadPFP()}>Download</div>
              <div className="button cursor-pointer py-4 mt-8" onClick={() => refreshNfts()}>Next</div>
            </div>
          </div>
        )}
        <div className="flex align-center flex-col max-w-2xl mx-auto text-center mt-10 mb-12 p-4">
            <div className="text-md ">
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
            <img src="/flowers/metamask-fox.svg" className="h-5 w-5" />
            <span className="roboto">Metamask</span>
          </button>
          <button
            onClick={() => {
              setWorking(true);
              activate(wcConnector);
            }}
            className={cn(cls, "text-blue-500 border-blue-600")}
          >
            <img src="/flowers/walletconnect-logo.svg" className="h-5 w-5" />
            <span className="roboto">WalletConnect</span>
          </button>
        </div>
      </>
    );
  }

  function MintButton({ className, ...props }) {
    return (
      <button
        className={cn(className)}
        {...props}
      />
    );
  }
