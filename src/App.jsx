import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, FileText, Phone, Trash2, IceCream2, Candy } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const productos = [
  { id: 1, nombre: 'Vaso grande', precio: 12, category: 'Helados', emoji: '🍦', color: 'from-pink-300 to-rose-300' },
  { id: 2, nombre: 'Vaso mediano', precio: 8, category: 'Helados', emoji: '🍨', color: 'from-blue-300 to-cyan-300' },
  { id: 3, nombre: 'Vaso pequeño', precio: 5, category: 'Helados', emoji: '🍧', color: 'from-purple-300 to-fuchsia-300' },
  { id: 4, nombre: 'Mango preparado', precio: 6, category: 'Frutas', emoji: '🥭', color: 'from-yellow-300 to-orange-300' },
  { id: 5, nombre: 'Piña preparada', precio: 6, category: 'Frutas', emoji: '🍍', color: 'from-green-300 to-emerald-300' },
  { id: 6, nombre: 'Brocheta', precio: 8, category: 'Frutas', emoji: '🍡', color: 'from-red-300 to-orange-400' },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: 'S/N', nit: '0', phone: '' });

  const addToCart = (producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item => item.id === producto.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...producto, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.precio * item.qty), 0);

  const generatePDF = (download = true) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('FRUTAS LOCAS MX SRL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Venta de Frutas y Helados', 105, 26, { align: 'center' });
    doc.text('Calle Víctor Gutiérrez No. 3339 - Zona 16 de julio - El Alto', 105, 32, { align: 'center' });
    doc.text('Teléfono: 77777777 (Simulado)', 105, 38, { align: 'center' });
    
    // Right side info (NIT, Factura No)
    doc.setFont("helvetica", "bold");
    doc.rect(140, 45, 60, 25);
    doc.text('NIT: 14651364026', 145, 52);
    doc.text('FACTURA N°: 0001', 145, 59);
    doc.text('AUTORIZACIÓN: 123456', 145, 66);

    // Title
    doc.setFontSize(16);
    doc.text('FACTURA', 105, 60, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('(Con Derecho a Crédito Fiscal)', 105, 65, { align: 'center' });
    
    // Customer Info
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 80);
    doc.text(`Señor(es): ${customerInfo.name}`, 15, 86);
    doc.text(`NIT/CI: ${customerInfo.nit}`, 15, 92);

    // Table
    const tableColumn = ["CANTIDAD", "DETALLE", "P. UNITARIO", "SUBTOTAL"];
    const tableRows = [];

    cart.forEach(item => {
      const rowData = [
        item.qty.toString(),
        item.nombre,
        `${item.precio.toFixed(2)} Bs`,
        `${(item.precio * item.qty).toFixed(2)} Bs`
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      startY: 100,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      foot: [
        ['', '', 'TOTAL:', `${total.toFixed(2)} Bs`]
      ],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.text('"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY"', 105, finalY, { align: 'center' });
    
    if (download) {
      doc.save('factura_frutas_locas.pdf');
    }
    
    return doc;
  };

  const sendWhatsApp = async () => {
    if (!customerInfo.phone) {
      alert("Por favor, ingresa el celular del cliente para enviar el mensaje.");
      return;
    }

    const doc = generatePDF(false);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], 'factura_frutas_locas.pdf', { type: 'application/pdf' });
    
    let itemsText = cart.map(item => `${item.qty}x ${item.nombre}`).join('%0A');
    let message = `Hola! Gracias por tu compra en *FRUTAS LOCAS MX SRL*.%0A%0A*Detalle de tu pedido:*%0A${itemsText}%0A%0A*Total pagado:* ${total.toFixed(2)} Bs`;
    
    // Si el navegador soporta compartir archivos nativamente (Celulares y Windows 10/11)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: 'Factura Frutas Locas MX',
          text: message.replace(/%0A/g, '\n'),
          files: [pdfFile]
        });
        return; // Éxito compartiendo nativamente
      } catch (error) {
        console.log('El usuario canceló o falló el share nativo', error);
      }
    }
    
    // Fallback para PC de escritorio sin Share API
    doc.save('factura_frutas_locas.pdf');
    let phoneParam = `591${customerInfo.phone.replace(/\D/g, '')}`; // Código de Bolivia +591
    
    alert("IMPORTANTE: Tu navegador de PC no permite adjuntar automáticamente. El PDF se ha descargado. Por favor, arrástralo al chat de WhatsApp que se abrirá a continuación.");
    
    window.open(`https://wa.me/${phoneParam}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Candy className="text-pink-500 w-8 h-8" />
            <h1 className="text-xl font-bold text-neutral-800 tracking-tight">Frutas Locas MX</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative p-2 bg-neutral-100 rounded-full">
                <ShoppingCart className="w-5 h-5 text-neutral-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col md:flex-row gap-8">
        
        {/* Product Catalog */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">Nuestros Productos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map(prod => (
              <motion.div
                key={prod.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col items-center cursor-pointer transition-all hover:shadow-md"
                onClick={() => addToCart(prod)}
              >
                <div className={`w-32 h-32 rounded-full bg-gradient-to-tr ${prod.color} flex items-center justify-center text-6xl mb-4 shadow-inner relative overflow-hidden`}>
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ repeat: Infinity, duration: 3 + Math.random(), ease: "easeInOut" }}
                  >
                    {prod.emoji}
                  </motion.div>
                </div>
                <h3 className="font-semibold text-lg text-neutral-800">{prod.nombre}</h3>
                <span className="text-sm text-neutral-500 mb-4">{prod.category}</span>
                <div className="w-full flex items-center justify-between mt-auto pt-4 border-t border-neutral-50">
                  <span className="font-bold text-xl text-neutral-900">{prod.precio} Bs</span>
                  <button 
                    className="bg-neutral-900 text-white p-2 rounded-full hover:bg-neutral-800 transition-colors"
                    onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Cart & Checkout */}
        <div className="w-full md:w-[400px] flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> 
              Pedido Actual
            </h2>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-400 text-center py-8">El carrito está vacío</motion.p>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm">
                        {item.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-neutral-800">{item.nombre}</p>
                        <p className="text-xs text-neutral-500">{item.precio} Bs c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded-md">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded-md">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-neutral-500">Total a Pagar</span>
                <span className="text-2xl font-bold text-neutral-900">{total.toFixed(2)} Bs</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
             <h2 className="text-xl font-bold text-neutral-800 mb-4">Datos de Facturación</h2>
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Nombre / Razón Social</label>
                  <input 
                    type="text" 
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Escriba el nombre..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">NIT / CI</label>
                  <input 
                    type="text" 
                    value={customerInfo.nit}
                    onChange={e => setCustomerInfo({...customerInfo, nit: e.target.value})}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Escriba el NIT..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Celular del Cliente</label>
                  <input 
                    type="text" 
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ej: 77123456"
                  />
                </div>
             </div>

             <div className="mt-6 space-y-3">
                <button 
                  onClick={() => generatePDF(true)}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Generar Factura (PDF)
                </button>
                <button 
                  onClick={sendWhatsApp}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Enviar por WhatsApp
                </button>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
