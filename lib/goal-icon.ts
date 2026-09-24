import {
  Refrigerator,
  WashingMachine,
  Car,
  Bike,
  Home,
  Palmtree,
  Plane,
  GraduationCap,
  Heart,
  Stethoscope,
  Smartphone,
  Laptop,
  Gift,
  Baby,
  Dog,
  Cat,
  Shirt,
  Utensils,
  Wrench,
  Tv,
  Camera,
  Music,
  Gamepad2,
  BookOpen,
  Umbrella,
  Dumbbell,
  Sofa,
  Building2,
  Scissors,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react'

const ICON_KEYWORDS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['nevera', 'refrigerador', 'frigorífico', 'frigorifico', 'heladera'], icon: Refrigerator },
  { keywords: ['lavadora'], icon: WashingMachine },
  { keywords: ['carro', 'auto', 'coche', 'vehiculo', 'vehículo'], icon: Car },
  { keywords: ['moto', 'motocicleta'], icon: Bike },
  { keywords: ['casa', 'apartamento', 'depa', 'vivienda', 'alquiler'], icon: Home },
  { keywords: ['viaje', 'vacaciones', 'vacacion', 'playa'], icon: Palmtree },
  { keywords: ['avion', 'avión', 'vuelo'], icon: Plane },
  { keywords: ['universidad', 'estudio', 'estudios', 'curso', 'carrera'], icon: GraduationCap },
  { keywords: ['boda', 'matrimonio', 'anillo'], icon: Heart },
  { keywords: ['medico', 'médico', 'salud', 'medicina', 'medicinas', 'doctor', 'hospital', 'cirugia', 'cirugía'], icon: Stethoscope },
  { keywords: ['celular', 'telefono', 'teléfono', 'iphone', 'smartphone'], icon: Smartphone },
  { keywords: ['laptop', 'computadora', 'pc', 'notebook'], icon: Laptop },
  { keywords: ['regalo', 'cumpleaños', 'cumpleanos', 'navidad'], icon: Gift },
  { keywords: ['bebe', 'bebé', 'niño', 'niña', 'hijo', 'hija'], icon: Baby },
  { keywords: ['perro', 'mascota', 'cachorro'], icon: Dog },
  { keywords: ['gato', 'gatito'], icon: Cat },
  { keywords: ['ropa', 'zapatos', 'vestimenta'], icon: Shirt },
  { keywords: ['comida', 'restaurante', 'cena'], icon: Utensils },
  { keywords: ['reparacion', 'reparación', 'arreglo', 'mantenimiento'], icon: Wrench },
  { keywords: ['television', 'televisión', 'tv', 'pantalla'], icon: Tv },
  { keywords: ['camara', 'cámara', 'foto'], icon: Camera },
  { keywords: ['musica', 'música', 'instrumento', 'guitarra'], icon: Music },
  { keywords: ['juego', 'consola', 'playstation', 'xbox', 'nintendo'], icon: Gamepad2 },
  { keywords: ['libro', 'libros', 'lectura'], icon: BookOpen },
  { keywords: ['emergencia', 'imprevisto'], icon: Umbrella },
  { keywords: ['gimnasio', 'ejercicio', 'pesas'], icon: Dumbbell },
  { keywords: ['mueble', 'muebles', 'sofa', 'sofá', 'sala'], icon: Sofa },
  { keywords: ['negocio', 'emprendimiento', 'oficina'], icon: Building2 },
  { keywords: ['corte', 'peluqueria', 'peluquería', 'salon', 'salón'], icon: Scissors },
]

/** Busca la primera coincidencia de palabra clave en el nombre de la meta; si no matchea nada, devuelve el ícono default (alcancía). */
export function getGoalIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase()
  for (const entry of ICON_KEYWORDS) {
    if (entry.keywords.some((k) => normalized.includes(k))) return entry.icon
  }
  return PiggyBank
}