import React, { useState, useEffect, useRef } from "react";
import { SVG } from "@svgdotjs/svg.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SVGTileApp = () => {
    const [copies, setCopies] = useState(4);
    const [rotation, setRotation] = useState(306);
    const [scale, setScale] = useState(0.17);
    const [rows, setRows] = useState(4);
    const [offset, setOffset] = useState(6);
    const [spacingFactor, setSpacingFactor] = useState(0.89);
    const [verticalSpacingFactor, setVerticalSpacingFactor] = useState(0.97);
    const [svgContent, setSvgContent] = useState(null);
    const svgContainerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        // Load default unicorn.svg on first render
        fetch("./unicorn.svg")
            .then(response => response.text())
            .then(setSvgContent)
            .catch(error => console.error("Error loading default SVG:", error));
    }, []);

    useEffect(() => {
        if (svgContent) {
            tileSVG();
        }
    }, [copies, rotation, scale, rows, offset, spacingFactor, verticalSpacingFactor, svgContent]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (e) => setSvgContent(e.target.result);
            reader.readAsText(file);
        } else {
            alert("Please upload a valid SVG file.");
        }
    };

    const getParameterString = () => {
        return `copies=${copies}; rows=${rows}; rot=${rotation}°; scale=${scale.toFixed(2)}; offset=${offset}px; hspace=${Math.round(spacingFactor * 100)}%; vspace=${Math.round(verticalSpacingFactor * 100)}%`;
    };
    

    const tileSVG = () => {
        if (!svgContainerRef.current || !svgContent) return;

        // Clear previous canvas content
        svgContainerRef.current.innerHTML = "";
        const canvas = SVG().addTo(svgContainerRef.current).size("100%", "100%");
        canvasRef.current = canvas;

        // Parse SVG content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const original = svgDoc.documentElement;

        // Extract viewBox for proper scaling
        const viewBox = original.getAttribute("viewBox")?.split(" ") || ["0", "0", "100", "100"];
        const width = parseFloat(original.getAttribute("width")) || parseFloat(viewBox[2]) || 100;
        const height = parseFloat(original.getAttribute("height")) || parseFloat(viewBox[3]) || 100;

        // Adjusted Spacing with Control
        const spacingX = width * scale * 1.2 * spacingFactor;
        const spacingY = height * scale * 1.2 * verticalSpacingFactor;

        for (let r = 0; r < rows; r++) {
            let rowOffset = r * offset;

            for (let i = 0; i < copies; i++) {
                let cloned = canvas.group();
                let nested = cloned.nested().svg(svgContent);
                nested.size(width * scale, height * scale)
                      .center(i * spacingX + rowOffset + width * scale / 2, r * spacingY + height * scale / 2);

                cloned.rotate(rotation, i * spacingX + rowOffset + width * scale / 2, r * spacingY + height * scale / 2);
            }
        }
    };

    const exportAsSVG = () => {
        if (!canvasRef.current) return;
        const svgData = canvasRef.current.svg();
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "export.svg";
        link.click();
    };

    const exportAsPNG = async () => {
        if (!svgContainerRef.current) return;
        const canvas = await html2canvas(svgContainerRef.current, { backgroundColor: null });
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "export.png";
        link.click();
    };

    const exportAsPDF = async () => {
        if (!svgContainerRef.current) return;
        const canvas = await html2canvas(svgContainerRef.current, { backgroundColor: null });
        const pdf = new jsPDF("landscape", "mm", "a4");
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 10, 10, 280, 180);
        pdf.save("export.pdf");
    };

    return (
        <div className="relative w-screen h-screen bg-[#F9F9F9] text-[#333333]">
            {/* The main canvas that takes up the whole screen */}
            <div ref={svgContainerRef} className="absolute top-0 left-0 w-full h-full"></div>

            {/* Fixed Upper-Right Quadrant Control Panel with Subtle Glow */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 backdrop-blur-md bg-white bg-opacity-50 border border-[#999999] shadow-lg p-4 transition-all duration-300 hover:shadow-[0px_0px_20px_rgba(255,255,255,0.5)]">
                <h2 className="text-xl font-semibold text-[#333333] mb-2">✨ Controls</h2>
                <div className="grid grid-cols-2 gap-2">
                    {/* First Column */}
                    <div>
                        <label className="block text-[#333333] text-sm">Copies</label>
                        <input type="range" min="1" max="20" value={copies} onChange={(e) => setCopies(parseInt(e.target.value))} className="w-full" />

                        <label className="block text-[#333333] text-sm">Rotation</label>
                        <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full" />

                        <label className="block text-[#333333] text-sm">Scale</label>
                        <input type="range" min="0.01" max="0.50" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" />
                   
                        <p className="text-sm text-[#666666] mt-2">🔢 {getParameterString()}</p>
                    </div>

                    {/* Second Column */}
                    <div>
                        <label className="block text-[#333333] text-sm">Rows</label>
                        <input type="range" min="1" max="100" value={rows} onChange={(e) => setRows(parseInt(e.target.value))} className="w-full" />

                        <label className="block text-[#333333] text-sm">Row Offset</label>
                        <input type="range" min="-50" max="50" value={offset} onChange={(e) => setOffset(parseInt(e.target.value))} className="w-full" />

                        <label className="block text-[#333333] text-sm">Horizontal Spacing</label>
                        <input type="range" min="0" max="1" step="0.01" value={spacingFactor} onChange={(e) => setSpacingFactor(parseFloat(e.target.value))} className="w-full" />

                        <label className="block text-[#333333] text-sm">Vertical Spacing</label>
                        <input type="range" min="0" max="1" step="0.01" value={verticalSpacingFactor} onChange={(e) => setVerticalSpacingFactor(parseFloat(e.target.value))} className="w-full" />
                    </div>
                </div>

                {/* Upload Button */}
                <div className="mt-4">
                    <label className="block text-[#333333] text-sm">Upload SVG</label>
                    <input type="file" accept=".svg" onChange={handleFileUpload} className="w-full border border-[#999999] rounded p-1 text-sm bg-transparent" />
                </div>

                {/* Export Buttons */}
                <div className="mt-4 flex gap-2">
                    <button className="border border-[#666666] text-[#333333] px-3 py-1 rounded hover:shadow-lg transition-all" onClick={exportAsSVG}>Export SVG</button>
                    <button className="border border-[#666666] text-[#333333] px-3 py-1 rounded hover:shadow-lg transition-all" onClick={exportAsPNG}>Export PNG</button>
                    <button className="border border-[#666666] text-[#333333] px-3 py-1 rounded hover:shadow-lg transition-all" onClick={exportAsPDF}>Export PDF</button>
                </div>

                {/* Clown LinkedIn Link */}
                <div className="absolute bottom-2 right-2">
                    <a href="https://www.linkedin.com/in/nicholasrrbennett/" target="_blank" rel="noopener noreferrer"
                        className="text-2xl transition-transform duration-200 hover:scale-110">
                        🤡
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SVGTileApp;
