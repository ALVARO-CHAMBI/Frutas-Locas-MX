import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, FileText, Phone, Candy, ClipboardList, X, Trash2 } from 'lucide-react';
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
  
  // Persistencia de datos en localStorage
  const [invoiceCounter, setInvoiceCounter] = useState(() => {
    const saved = localStorage.getItem('invoiceCounter');
    return saved ? parseInt(saved) : 1;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('salesRegistro');
    return saved ? JSON.parse(saved) : [];
  });

  const [showRegister, setShowRegister] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch('/logo.png');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Error cargando el logo', e);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    localStorage.setItem('invoiceCounter', invoiceCounter);
  }, [invoiceCounter]);

  useEffect(() => {
    localStorage.setItem('salesRegistro', JSON.stringify(sales));
  }, [sales]);

  const addToCart = (producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item => item.id === producto.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...producto, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: item.qty + delta };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.precio * item.qty), 0);

  const generatePDF = (invoiceNo, logoB64) => {
    const doc = new jsPDF();
    
    if (logoB64) {
      try {
        // Marca de agua en el fondo (centro)
        doc.setGState(new doc.GState({opacity: 0.15}));
        doc.addImage(logoB64, 'PNG', 45, 90, 120, 120);
        // Restaurar opacidad para el texto
        doc.setGState(new doc.GState({opacity: 1.0}));
      } catch (e) {
        console.log('Transparencia no soportada', e);
      }
      
      // Logo claro en la esquina superior izquierda
      doc.addImage(logoB64, 'PNG', 15, 10, 30, 30);
    }
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('FRUTAS LOCAS MX SRL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Venta de Frutas y Helados', 105, 26, { align: 'center' });
    doc.text('Calle Víctor Gutiérrez No. 3339 - Zona 16 de julio - El Alto', 105, 32, { align: 'center' });
    doc.text('Teléfono: 77777777', 105, 38, { align: 'center' });
    
    // Right side info (NIT, Factura No)
    doc.setFont("helvetica", "bold");
    doc.rect(140, 45, 60, 25);
    doc.text('NIT: 14651364026', 145, 52);
    // Número correlativo de 4 dígitos (ej: 0001, 0002)
    const formattedNo = String(invoiceNo).padStart(4, '0');
    doc.text(`FACTURA N°: ${formattedNo}`, 145, 59);
    doc.text('AUTORIZACIÓN: 123456', 145, 66);

    // Title
    doc.setFontSize(16);
    doc.text('FACTURA', 105, 60, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('(Con Derecho a Crédito Fiscal)', 105, 65, { align: 'center' });
    
    // Customer Info
    doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 80);
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
    
    return doc;
  };

  const processSale = async (actionType) => {
    if (cart.length === 0) return;
    
    if (actionType === 'whatsapp' && !customerInfo.phone) {
      alert("Por favor, ingresa el celular del cliente para enviar el mensaje por WhatsApp.");
      return;
    }

    const currentInvoiceNo = invoiceCounter;
    
    // 1. Generar el PDF con el número actual
    const doc = generatePDF(currentInvoiceNo, logoBase64);
    const fileName = `factura_${String(currentInvoiceNo).padStart(4, '0')}.pdf`;

    // Si solo es descargar, descargamos y no finalizamos la venta aún
    if (actionType === 'pdf') {
      doc.save(fileName);
      return; 
    }

    // --- DE AQUÍ EN ADELANTE ES FINALIZAR VENTA Y WHATSAPP ---

    // 2. Registrar la Venta
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      invoiceNo: currentInvoiceNo,
      customer: customerInfo.name,
      nit: customerInfo.nit,
      total: total,
      itemsCount: cart.reduce((a, b) => a + b.qty, 0)
    };
    
    setSales(prev => [newSale, ...prev]);
    setInvoiceCounter(prev => prev + 1);

    // 3. Lógica de WhatsApp
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    let itemsText = cart.map(item => `${item.qty}x ${item.nombre}`).join('\n');
    let cleanMessage = `Hola! Gracias por tu compra en *FRUTAS LOCAS MX SRL*.\n\n*Factura N°:* ${currentInvoiceNo}\n*Detalle de tu pedido:*\n${itemsText}\n\n*Total pagado:* ${total.toFixed(2)} Bs`;
    let encodedMessage = encodeURIComponent(cleanMessage);
    
    try {
      await navigator.clipboard.writeText(cleanMessage);
    } catch (err) {
      console.log('No se pudo copiar al portapapeles automáticamente', err);
    }
    
    let shareSuccess = false;
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: `Factura ${currentInvoiceNo} Frutas Locas MX`,
          text: cleanMessage,
          files: [pdfFile]
        });
        shareSuccess = true;
      } catch (error) {
        console.log('Share cancelado o falló', error);
      }
    }
    
    if (!shareSuccess) {
      doc.save(fileName);
      let phoneParam = customerInfo.phone ? `591${customerInfo.phone.replace(/\D/g, '')}` : ''; 
      alert(`¡Factura N° ${currentInvoiceNo} registrada y texto copiado!\n\n1. Arrastra el PDF a WhatsApp.\n2. Dale "Pegar" (Ctrl+V) en el comentario del archivo.`);
      window.open(`https://wa.me/${phoneParam}?text=${encodedMessage}`, '_blank');
    }

    // 4. Limpiar para el siguiente cliente
    setCart([]);
    setCustomerInfo({ name: 'S/N', nit: '0', phone: '' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Frutas Locas MX" className="w-10 h-10 object-contain drop-shadow-sm" />
            <h1 className="text-xl font-bold text-neutral-800 tracking-tight">Frutas Locas MX</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowRegister(true)}
                className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 px-3 py-2 rounded-lg transition-colors"
             >
                <ClipboardList className="w-5 h-5" />
                <span className="hidden sm:inline">Registro de Ventas</span>
             </button>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Nuestros Productos</h2>
            <div className="bg-white px-3 py-1 rounded-full border border-neutral-200 text-sm font-semibold text-neutral-500 shadow-sm">
              Siguiente Factura: N° {String(invoiceCounter).padStart(4, '0')}
            </div>
          </div>
          
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
                        <button onClick={() => removeFromCart(item.id)} className="p-1 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar producto">
                          <Trash2 className="w-4 h-4" />
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
                  onClick={() => processSale('pdf')}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Descargar Factura
                </button>
                <button 
                  onClick={() => processSale('whatsapp')}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Finalizar Venta y Enviar a WA
                </button>
             </div>
          </div>

        </div>
      </main>

      {/* MODAL REGISTRO DE VENTAS */}
      <AnimatePresence>
        {showRegister && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                  <ClipboardList className="text-primary w-6 h-6" />
                  Registro de Ventas
                </h2>
                <button 
                  onClick={() => setShowRegister(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {sales.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    No hay ventas registradas todavía.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-neutral-100 text-sm font-semibold text-neutral-500">
                        <th className="py-3 px-4">Factura N°</th>
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4 text-center">Artículos</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            {String(sale.invoiceNo).padStart(4, '0')}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-600">{sale.date}</td>
                          <td className="py-3 px-4 text-sm text-neutral-600">
                            {sale.customer} <br/>
                            <span className="text-xs text-neutral-400">NIT: {sale.nit}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-600 text-center">{sale.itemsCount}</td>
                          <td className="py-3 px-4 text-sm font-bold text-neutral-900 text-right">{sale.total.toFixed(2)} Bs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center text-sm text-neutral-500">
                <span>Total Ventas: {sales.length}</span>
                <span className="font-bold text-lg text-neutral-900">
                  Total Ingresos: {sales.reduce((acc, sale) => acc + sale.total, 0).toFixed(2)} Bs
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
