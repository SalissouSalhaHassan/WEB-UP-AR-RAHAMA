"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CreditCard, Search, Filter, Printer, Download, Check, X, User,
  Sparkles, Layers, FileText, CheckCircle2, AlertCircle, Image as ImageIcon,
  ChevronLeft, ChevronRight, RefreshCw, Upload, Eye, EyeOff, LayoutGrid, ShieldCheck, ArrowRight,
  Users, FlipHorizontal, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getStudents } from "@/domains/students/actions/students.actions";
import { getBranches } from "@/domains/settings/actions/settings.actions";
import CardDesigner from "./designer/CardDesigner";
import CardCanvas from "./designer/CardCanvas";
import { SMART_CARD_PRESETS } from "./designer/cardSmartPresets";
import { CardElement, CARD_DIMENSIONS, CardSize, Orientation } from "./designer/types";
import { renderCardElementsToDataURL } from "./designer/cardExportEngine";
import { StudentCard } from "./StudentCard";
import jsPDF from "jspdf";

const SAMPLE_STUDENTS = [
  // --- CI A ---
  { id: 325, nomEtudiant: "Maman Dan Falké", prenomEtudiant: "Aboubacar", numAdmission: "EDUT-2024-000325", classe: "CI A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2018-07-09", lieuNaissance: "Téra", nationalite: "Nigérienne", photoPath: null },
  { id: 330, nomEtudiant: "Abdoul Razak", prenomEtudiant: "Hamani", numAdmission: "EDUT-2024-000330", classe: "CI A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2018-03-12", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },
  { id: 331, nomEtudiant: "Balkissa", prenomEtudiant: "Seydou", numAdmission: "EDUT-2024-000331", classe: "CI A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2018-11-05", lieuNaissance: "Zinder", nationalite: "Nigérienne", photoPath: null },

  // --- CP A ---
  { id: 324, nomEtudiant: "Maman", prenomEtudiant: "Adah", numAdmission: "EDUT-2024-000324", classe: "CP A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2017-05-14", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },
  { id: 332, nomEtudiant: "Hadiza", prenomEtudiant: "Garba", numAdmission: "EDUT-2024-000332", classe: "CP A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2017-09-20", lieuNaissance: "Maradi", nationalite: "Nigérienne", photoPath: null },
  { id: 333, nomEtudiant: "Saley", prenomEtudiant: "Soumana", numAdmission: "EDUT-2024-000333", classe: "CP A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2017-02-18", lieuNaissance: "Tahoua", nationalite: "Nigérienne", photoPath: null },

  // --- CE1 A ---
  { id: 323, nomEtudiant: "Maman", prenomEtudiant: "Biba", numAdmission: "EDUT-2024-000323", classe: "CE1 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2016-11-20", lieuNaissance: "Zinder", nationalite: "Nigérienne", photoPath: null },
  { id: 334, nomEtudiant: "Boubacar", prenomEtudiant: "Moussa", numAdmission: "EDUT-2024-000334", classe: "CE1 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2016-04-15", lieuNaissance: "Dosso", nationalite: "Nigérienne", photoPath: null },
  { id: 335, nomEtudiant: "Ramatou", prenomEtudiant: "Djibo", numAdmission: "EDUT-2024-000335", classe: "CE1 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2016-08-30", lieuNaissance: "Tillabéri", nationalite: "Nigérienne", photoPath: null },

  // --- CE2 A ---
  { id: 322, nomEtudiant: "Mamadou Ibrahim", prenomEtudiant: "Salifou", numAdmission: "EDUT-2024-000322", classe: "CE2 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2015-08-12", lieuNaissance: "Maradi", nationalite: "Nigérienne", photoPath: null },
  { id: 336, nomEtudiant: "Kadidiatou", prenomEtudiant: "Hassane", numAdmission: "EDUT-2024-000336", classe: "CE2 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2015-01-22", lieuNaissance: "Agadez", nationalite: "Nigérienne", photoPath: null },
  { id: 337, nomEtudiant: "Ali", prenomEtudiant: "Tankari", numAdmission: "EDUT-2024-000337", classe: "CE2 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2015-10-10", lieuNaissance: "Diffa", nationalite: "Nigérienne", photoPath: null },

  // --- CM1 A ---
  { id: 326, nomEtudiant: "Mahamadou Kane", prenomEtudiant: "Issaka", numAdmission: "EDUT-2024-000326", classe: "CM1 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2014-11-04", lieuNaissance: "Tahoua", nationalite: "Nigérienne", photoPath: null },
  { id: 338, nomEtudiant: "Amina", prenomEtudiant: "Nouhou", numAdmission: "EDUT-2024-000338", classe: "CM1 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2014-06-17", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },
  { id: 339, nomEtudiant: "Yacouba", prenomEtudiant: "Amadou", numAdmission: "EDUT-2024-000339", classe: "CM1 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2014-03-25", lieuNaissance: "Zinder", nationalite: "Nigérienne", photoPath: null },

  // --- CM2 A ---
  { id: 327, nomEtudiant: "Aïssatou", prenomEtudiant: "Souley", numAdmission: "EDUT-2024-000327", classe: "CM2 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2013-02-18", lieuNaissance: "Agadez", nationalite: "Nigérienne", photoPath: null },
  { id: 340, nomEtudiant: "Sani", prenomEtudiant: "Yahaya", numAdmission: "EDUT-2024-000340", classe: "CM2 A", educationalLevel: "Primaire Général", sexe: "Garçon", dateNaissance: "2013-09-08", lieuNaissance: "Maradi", nationalite: "Nigérienne", photoPath: null },
  { id: 341, nomEtudiant: "Halima", prenomEtudiant: "Ousmane", numAdmission: "EDUT-2024-000341", classe: "CM2 A", educationalLevel: "Primaire Général", sexe: "Fille", dateNaissance: "2013-12-14", lieuNaissance: "Tahoua", nationalite: "Nigérienne", photoPath: null },

  // --- 6ème A ---
  { id: 321, nomEtudiant: "Malam Balla", prenomEtudiant: "Sanoussi", numAdmission: "EDUT-2024-000321", classe: "6ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2012-03-18", lieuNaissance: "Tahoua", nationalite: "Nigérienne", photoPath: null },
  { id: 342, nomEtudiant: "Rahinatou", prenomEtudiant: "Zakari", numAdmission: "EDUT-2024-000342", classe: "6ème A", educationalLevel: "Collège Général", sexe: "Fille", dateNaissance: "2012-07-22", lieuNaissance: "Dosso", nationalite: "Nigérienne", photoPath: null },
  { id: 343, nomEtudiant: "Hamza", prenomEtudiant: "Abdoulaye", numAdmission: "EDUT-2024-000343", classe: "6ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2012-10-30", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },

  // --- 5ème A ---
  { id: 320, nomEtudiant: "Malam Maina", prenomEtudiant: "Abass", numAdmission: "EDUT-2024-000320", classe: "5ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2011-12-05", lieuNaissance: "Diffa", nationalite: "Nigérienne", photoPath: null },
  { id: 344, nomEtudiant: "Mariama", prenomEtudiant: "Oumarou", numAdmission: "EDUT-2024-000344", classe: "5ème A", educationalLevel: "Collège Général", sexe: "Fille", dateNaissance: "2011-05-19", lieuNaissance: "Tillabéri", nationalite: "Nigérienne", photoPath: null },
  { id: 345, nomEtudiant: "Souleymane", prenomEtudiant: "Bello", numAdmission: "EDUT-2024-000345", classe: "5ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2011-08-11", lieuNaissance: "Zinder", nationalite: "Nigérienne", photoPath: null },

  // --- 4ème A ---
  { id: 319, nomEtudiant: "Malam Issoufou", prenomEtudiant: "Mme Hamiss", numAdmission: "EDUT-2024-000319", classe: "4ème A", educationalLevel: "Collège Général", sexe: "Fille", dateNaissance: "2010-09-30", lieuNaissance: "Dosso", nationalite: "Nigérienne", photoPath: null },
  { id: 346, nomEtudiant: "Ibrahim", prenomEtudiant: "Adamou", numAdmission: "EDUT-2024-000346", classe: "4ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2010-02-14", lieuNaissance: "Maradi", nationalite: "Nigérienne", photoPath: null },
  { id: 347, nomEtudiant: "Habiba", prenomEtudiant: "Salifou", numAdmission: "EDUT-2024-000347", classe: "4ème A", educationalLevel: "Collège Général", sexe: "Fille", dateNaissance: "2010-11-28", lieuNaissance: "Tahoua", nationalite: "Nigérienne", photoPath: null },

  // --- 3ème A ---
  { id: 318, nomEtudiant: "Ousmane", prenomEtudiant: "Seydou", numAdmission: "EDUT-2024-000318", classe: "3ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2009-04-12", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },
  { id: 348, nomEtudiant: "Nafissatou", prenomEtudiant: "Bello", numAdmission: "EDUT-2024-000348", classe: "3ème A", educationalLevel: "Collège Général", sexe: "Fille", dateNaissance: "2009-07-07", lieuNaissance: "Agadez", nationalite: "Nigérienne", photoPath: null },
  { id: 349, nomEtudiant: "Kabirou", prenomEtudiant: "Moussa", numAdmission: "EDUT-2024-000349", classe: "3ème A", educationalLevel: "Collège Général", sexe: "Garçon", dateNaissance: "2009-12-01", lieuNaissance: "Diffa", nationalite: "Nigérienne", photoPath: null },

  // --- 2nde A ---
  { id: 317, nomEtudiant: "Hamadou", prenomEtudiant: "Garba", numAdmission: "EDUT-2024-000317", classe: "2nde A", educationalLevel: "Lycée Général", sexe: "Garçon", dateNaissance: "2008-01-25", lieuNaissance: "Tillabéri", nationalite: "Nigérienne", photoPath: null },
  { id: 350, nomEtudiant: "Zeinabou", prenomEtudiant: "Mahamane", numAdmission: "EDUT-2024-000350", classe: "2nde A", educationalLevel: "Lycée Général", sexe: "Fille", dateNaissance: "2008-08-16", lieuNaissance: "Niamey", nationalite: "Nigérienne", photoPath: null },

  // --- 1ère A ---
  { id: 316, nomEtudiant: "Zalika", prenomEtudiant: "Abdou", numAdmission: "EDUT-2024-000316", classe: "1ère A", educationalLevel: "Lycée Général", sexe: "Fille", dateNaissance: "2007-06-19", lieuNaissance: "Maradi", nationalite: "Nigérienne", photoPath: null },
  { id: 351, nomEtudiant: "Bachir", prenomEtudiant: "Harouna", numAdmission: "EDUT-2024-000351", classe: "1ère A", educationalLevel: "Lycée Général", sexe: "Garçon", dateNaissance: "2007-10-03", lieuNaissance: "Zinder", nationalite: "Nigérienne", photoPath: null },
];

function isValidPhoto(path?: string | null): boolean {
  if (!path || typeof path !== "string") return false;
  const p = path.trim().toLowerCase();
  if (p.length === 0 || p.includes("placeholder")) return false;
  return true;
}

function normalizeSearchText(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function expandSearchText(str?: string | null): string {
  if (!str) return "";
  const norm = normalizeSearchText(str);
  const expansions = [norm];
  if (norm.includes("tle") || norm.includes("terminal")) {
    expansions.push("tle", "terminale", "terminal", "bac");
  }
  if (norm.includes("1ere") || norm.includes("1er") || norm.includes("premiere")) {
    expansions.push("1ere", "1er", "premiere");
  }
  if (norm.includes("2nde") || norm.includes("seconde")) {
    expansions.push("2nde", "2nd", "seconde");
  }
  if (norm.includes("3eme") || norm.includes("3e") || norm.includes("troisieme")) {
    expansions.push("3eme", "3e", "troisieme");
  }
  if (norm.includes("4eme") || norm.includes("4e") || norm.includes("quatrieme")) {
    expansions.push("4eme", "4e", "quatrieme");
  }
  if (norm.includes("5eme") || norm.includes("5e") || norm.includes("cinquieme")) {
    expansions.push("5eme", "5e", "cinquieme");
  }
  if (norm.includes("6eme") || norm.includes("6e") || norm.includes("sixieme")) {
    expansions.push("6eme", "6e", "sixieme");
  }
  return expansions.join(" ");
}

async function waitForImagesInNode(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 1500);
      });
    })
  );
}

export default function CardStudioContainer() {
  const [activeTab, setActiveTab] = useState<"design" | "données" | "impression">("design");
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection & Search State
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [previewStudentId, setPreviewStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<"all" | "selected" | "no-photo">("all");

  // Advanced Print & Export Configuration State
  const [printScope, setPrintScope] = useState<"auto" | "single" | "class" | "selected">("auto");
  const [printSidesMode, setPrintSidesMode] = useState<"recto-verso" | "recto" | "verso">("recto-verso");
  const [pdfPageFormat, setPdfPageFormat] = useState<"cr80-individual" | "a4-grid">("cr80-individual");
  const [renderTemplateStyle, setRenderTemplateStyle] = useState<"studio" | "classic">("studio");
  const [printing, setPrinting] = useState(false);

  // Synchronized Studio Template Design State
  const [studioDesign, setStudioDesign] = useState<{
    rectoElements: CardElement[];
    versoElements: CardElement[];
    cardType: CardSize;
    orientation: Orientation;
    templateName: string;
  }>({
    rectoElements: SMART_CARD_PRESETS[0].rectoElements,
    versoElements: SMART_CARD_PRESETS[0].versoElements,
    cardType: SMART_CARD_PRESETS[0].cardType,
    orientation: SMART_CARD_PRESETS[0].orientation,
    templateName: SMART_CARD_PRESETS[0].name,
  });

  const handleDesignStateChange = useCallback(
    (newDesign: {
      rectoElements: CardElement[];
      versoElements: CardElement[];
      cardType: CardSize;
      orientation: Orientation;
      templateName: string;
    }) => {
      setStudioDesign(newDesign);
    },
    []
  );

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingStudentId, setUploadingStudentId] = useState<number | null>(null);

  useEffect(() => {
    async function loadStudioData() {
      try {
        const { localDb } = await import("@/infrastructure/local-db/dexie");
        const localStudents = await localDb.students.toArray();
        if (localStudents && localStudents.length > 0) {
          const mapped = localStudents.map((s: any) => ({
            id: s.id || Math.floor(Math.random() * 10000),
            nomEtudiant: s.nomEtudiant,
            prenomEtudiant: s.prenomEtudiant || "",
            numAdmission: s.numAdmission,
            classe: s.classe || "Classe N/A",
            educationalLevel: s.educationalLevel || s.cycle || "Secondaire",
            sexe: s.sexe || "Garçon",
            dateNaissance: s.dateNaissance || "2012-01-01",
            lieuNaissance: s.lieuNaissance || "Maradi",
            nationalite: s.nationalite || "Nigérienne",
            photoPath: s.photoPath || null,
            whatsapp: s.whatsapp || s.telTuteur || s.telephone || null,
          }));
          setStudents(mapped);
          setPreviewStudentId(mapped[0].id);
        }
      } catch (err) {
        console.debug("IndexedDB students load notice:", err);
      }

      if (navigator.onLine) {
        Promise.all([getStudents(), getBranches()])
          .then(([studRes, branchRes]: [any, any]) => {
            let studData: any[] = [];
            if (Array.isArray(studRes)) {
              studData = studRes;
            } else if (Array.isArray(studRes?.data)) {
              studData = studRes.data;
            } else if (Array.isArray(studRes?.data?.data)) {
              studData = studRes.data.data;
            }

            if (Array.isArray(studData) && studData.length > 0) {
              setStudents(studData);
              setPreviewStudentId(studData[0].id);
            }

            const branchData = branchRes?.data?.data || branchRes?.data || [];
            if (Array.isArray(branchData)) {
              setBranches(branchData);
            }
          })
          .catch((err) => {
            console.warn("Server data fetch failed:", err);
            setStudents((prev) => (prev.length > 0 ? prev : SAMPLE_STUDENTS));
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
    loadStudioData();
  }, []);

  const handlePhotoUpload = (studentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, photoPath: dataUrl } : s))
      );
      toast.success("Photo de l'élève ajoutée avec succès !");
    };
    reader.readAsDataURL(file);
  };

  const triggerUploadFor = (studentId: number) => {
    setUploadingStudentId(studentId);
    fileInputRef.current?.click();
  };

  // Unique Classes extracted from Students
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.classe && String(s.classe).trim()) {
        set.add(String(s.classe).trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [students]);

  // Filtered Students List for Left Sidebar
  const filteredStudents = useMemo(() => {
    const q = normalizeSearchText(searchQuery);

    return students.filter((s) => {
      if (selectedClassFilter !== "ALL" && String(s.classe || "").trim() !== selectedClassFilter) {
        return false;
      }

      let match = true;
      if (q) {
        const rawTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const nom = normalizeSearchText(s.nomEtudiant);
        const prenom = normalizeSearchText(s.prenomEtudiant);
        const fullName = `${nom} ${prenom}`;
        const reverseName = `${prenom} ${nom}`;
        const matricule = normalizeSearchText(`${s.numAdmission || ""} ${s.id || ""} ${s.studentId || ""}`);
        const classe = expandSearchText(`${s.classe || ""} ${s.section || ""} ${s.educationalLevel || ""} ${s.filiere || ""}`);
        const keywords = "classe class cl matricule mat id eleve etudiant student";
        const haystack = `${fullName} ${reverseName} ${matricule} ${classe} ${keywords}`;

        match = rawTokens.every((tok) => {
          const normTok = normalizeSearchText(tok);
          const expandedTok = expandSearchText(normTok);
          const subwords = expandedTok.split(/\s+/).filter(Boolean);
          return haystack.includes(normTok) || subwords.some((sub) => haystack.includes(sub));
        });
      }

      if (filterType === "selected") return match && selectedStudentIds.includes(s.id);
      if (filterType === "no-photo") return match && !isValidPhoto(s.photoPath);
      return match;
    });
  }, [students, searchQuery, selectedClassFilter, filterType, selectedStudentIds]);

  // Active Preview Student
  const activeStudent = useMemo(() => {
    if (previewStudentId) {
      return students.find((s) => s.id === previewStudentId) || students[0] || null;
    }
    return students[0] || null;
  }, [students, previewStudentId]);

  const activeBranch = useMemo(() => {
    return branches[0] || null;
  }, [branches]);

  // Checkboxes Selection Logic
  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allFilteredSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));

    if (allFilteredSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSelectEntireClass = (className: string) => {
    setSelectedClassFilter(className);
    setFilterType("all");
    if (className === "ALL") {
      const allIds = students.map((s) => s.id);
      setSelectedStudentIds(allIds);
      setPrintScope("selected");
      toast.success(`Tous les ${allIds.length} élèves ont été sélectionnés !`);
    } else {
      const classStudents = students.filter((s) => String(s.classe || "").trim() === className);
      const ids = classStudents.map((s) => s.id);
      setSelectedStudentIds(ids);
      if (classStudents[0]) setPreviewStudentId(classStudents[0].id);
      setPrintScope("class");
      toast.success(`Classe "${className}" sélectionnée (${ids.length} élève(s)) !`);
    }
  };

  // Selected Students List
  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Resolved Students to Generate / Print based on printScope
  const targetStudentsToPrint = useMemo(() => {
    if (printScope === "single") {
      return activeStudent ? [activeStudent] : [];
    }
    if (printScope === "class") {
      const targetClass =
        selectedClassFilter !== "ALL"
          ? selectedClassFilter
          : activeStudent?.classe || availableClasses[0] || "";
      const byClass = students.filter((s) => String(s.classe || "").trim() === targetClass);
      return byClass.length > 0 ? byClass : activeStudent ? [activeStudent] : [];
    }
    if (printScope === "selected") {
      return selectedStudents.length > 0 ? selectedStudents : activeStudent ? [activeStudent] : [];
    }
    // "auto": if user selected students, use them; else if class filter active, use class; else activeStudent
    if (selectedStudents.length > 0) return selectedStudents;
    if (selectedClassFilter !== "ALL" && filteredStudents.length > 0) return filteredStudents;
    return activeStudent ? [activeStudent] : [];
  }, [printScope, activeStudent, selectedClassFilter, availableClasses, students, selectedStudents, filteredStudents]);

  // Resolved Sides to Generate ("recto-verso" => ["recto", "verso"])
  const targetSides = useMemo<("recto" | "verso")[]>(() => {
    if (printSidesMode === "recto-verso") return ["recto", "verso"];
    if (printSidesMode === "verso") return ["verso"];
    return ["recto"];
  }, [printSidesMode]);

  // Render all batch card faces at Ultra-HD 384 DPI (scale: 4) using Native Canvas 2D Engine
  const captureBatchCardsHighDPI = async () => {
    const captured: {
      imgData: string;
      studentName: string;
      matricule: string;
      classe: string;
      side: "recto" | "verso";
    }[] = [];

    const activeRecto =
      renderTemplateStyle === "studio"
        ? studioDesign.rectoElements
        : SMART_CARD_PRESETS[0].rectoElements;
    const activeVerso =
      renderTemplateStyle === "studio"
        ? studioDesign.versoElements
        : SMART_CARD_PRESETS[0].versoElements;
    const activeCardType =
      renderTemplateStyle === "studio" ? studioDesign.cardType : "CR80";
    const activeOrientation =
      renderTemplateStyle === "studio" ? studioDesign.orientation : "landscape";

    for (let i = 0; i < targetStudentsToPrint.length; i++) {
      const st = targetStudentsToPrint[i];
      const fullName = `${st.nomEtudiant || ""} ${st.prenomEtudiant || ""}`.trim() || `Eleve_${i + 1}`;

      for (const side of targetSides) {
        const elementsToRender = side === "recto" ? activeRecto : activeVerso;
        const imgData = await renderCardElementsToDataURL({
          elements: elementsToRender,
          cardType: activeCardType,
          orientation: activeOrientation,
          activeStudent: st,
          activeBranch,
          scale: 4, // 384 DPI crisp native canvas rendering
          format: "png",
        });

        captured.push({
          imgData,
          studentName: fullName,
          matricule: st.numAdmission || "",
          classe: st.classe || "",
          side,
        });
      }
    }
    return captured;
  };

  // Generate & Download High-Precision PDF (Recto-Verso supported, CR80 Individual or A4 Grid)
  const handleBatchPrintPDF = async (directBrowserPrint = false) => {
    if (targetStudentsToPrint.length === 0) {
      toast.error("Veuillez sélectionner au moins un élève ou une classe.");
      return;
    }

    setPrinting(true);
    const totalFaces = targetStudentsToPrint.length * targetSides.length;
    const modeLabel =
      printSidesMode === "recto-verso"
        ? "Recto-Verso (Duplex)"
        : printSidesMode === "recto"
        ? "Recto seul"
        : "Verso seul";

    const toastId = toast.loading(
      `Génération Ultra-HD (300 DPI) de ${targetStudentsToPrint.length} carte(s) [${modeLabel} — ${totalFaces} face(s)]...`
    );

    try {
      // Give React a brief frame if hidden render container just updated
      await new Promise((r) => setTimeout(r, 150));
      const capturedFaces = await captureBatchCardsHighDPI();

      if (capturedFaces.length === 0) {
        toast.error("Aucune carte trouvée pour l'exportation.", { id: toastId });
        setPrinting(false);
        return;
      }

      const isPortraitCard =
        renderTemplateStyle === "studio" && studioDesign.orientation === "portrait";
      const baseMm = CARD_DIMENSIONS[studioDesign.cardType || "CR80"] || CARD_DIMENSIONS.CR80;
      const cardW = isPortraitCard ? baseMm.mmHeight : baseMm.mmWidth; // 85.6mm landscape, 54mm portrait
      const cardH = isPortraitCard ? baseMm.mmWidth : baseMm.mmHeight; // 54mm landscape, 85.6mm portrait

      if (directBrowserPrint) {
        // Open a dedicated, millimeter-calibrated print window with 300+ DPI PNGs
        const printWin = window.open("", "_blank", "width=1100,height=800");
        if (!printWin) {
          toast.error("Veuillez autoriser les pop-ups pour lancer l'impression directe.", { id: toastId });
          setPrinting(false);
          return;
        }

        const isIndividual = pdfPageFormat === "cr80-individual";
        const htmlCards = capturedFaces
          .map(
            (c) => `
            <div class="card-item">
              <img src="${c.imgData}" alt="${c.studentName} - ${c.side}" />
            </div>`
          )
          .join("");

        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Impression Cartes ID HD - ${modeLabel}</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  background: #fff;
                  font-family: Arial, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                ${
                  isIndividual
                    ? `
                  @page {
                    size: ${cardW}mm ${cardH}mm;
                    margin: 0mm;
                  }
                  .card-item {
                    width: ${cardW}mm;
                    height: ${cardH}mm;
                    page-break-after: always;
                    break-after: page;
                    overflow: hidden;
                  }
                  .card-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    display: block;
                  }
                `
                    : `
                  @page {
                    size: A4 landscape;
                    margin: 10mm;
                  }
                  .grid-container {
                    display: grid;
                    grid-template-columns: repeat(3, ${cardW}mm);
                    grid-auto-rows: ${cardH}mm;
                    gap: 4mm;
                    justify-content: center;
                  }
                  .card-item {
                    width: ${cardW}mm;
                    height: ${cardH}mm;
                    border: 0.2mm dashed #cbd5e1;
                    border-radius: 3mm;
                    overflow: hidden;
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                  .card-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: fill;
                    display: block;
                  }
                `
                }
              </style>
            </head>
            <body>
              <div class="${isIndividual ? "" : "grid-container"}">
                ${htmlCards}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 350);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        toast.success(`Impression haute précision lancée (${capturedFaces.length} face(s)) !`, { id: toastId });
        setPrinting(false);
        return;
      }

      if (pdfPageFormat === "cr80-individual") {
        // Native CR80 PVC Card Format (1 face per page: Page 1 = Student 1 Recto, Page 2 = Student 1 Verso, etc.)
        const pdf = new jsPDF({
          orientation: isPortraitCard ? "portrait" : "landscape",
          unit: "mm",
          format: [cardW, cardH],
          compress: false,
        });

        capturedFaces.forEach((face, idx) => {
          if (idx > 0) {
            pdf.addPage([cardW, cardH], isPortraitCard ? "portrait" : "landscape");
          }
          pdf.addImage(face.imgData, "PNG", 0, 0, cardW, cardH);
        });

        const suffix =
          targetStudentsToPrint.length === 1
            ? `${targetStudentsToPrint[0].nomEtudiant || "Eleve"}_${targetStudentsToPrint[0].prenomEtudiant || ""}`
                .trim()
                .replace(/\s+/g, "_")
            : selectedClassFilter !== "ALL"
            ? `Classe_${selectedClassFilter.replace(/\s+/g, "_")}`
            : `Lot_${targetStudentsToPrint.length}_Eleves`;

        pdf.save(`Cartes_CR80_${printSidesMode.toUpperCase()}_${suffix}.pdf`);
      } else {
        // A4 Sheet Format (Grid with crop marks)
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
          compress: false,
        });

        const cols = isPortraitCard ? 4 : 3;
        const rows = isPortraitCard ? 2 : 3;
        const cardsPerPage = cols * rows;
        const gapX = 4;
        const gapY = 4;
        const totalGridW = cols * cardW + (cols - 1) * gapX;
        const totalGridH = rows * cardH + (rows - 1) * gapY;
        const startX = Math.max(8, (297 - totalGridW) / 2);
        const startY = Math.max(8, (210 - totalGridH) / 2);

        capturedFaces.forEach((face, i) => {
          const pageIndex = Math.floor(i / cardsPerPage);
          const cardOnPage = i % cardsPerPage;
          const col = cardOnPage % cols;
          const row = Math.floor(cardOnPage / cols);

          const posX = startX + col * (cardW + gapX);
          const posY = startY + row * (cardH + gapY);

          if (cardOnPage === 0 && pageIndex > 0) {
            pdf.addPage("a4", "landscape");
          }

          // Header label on each A4 sheet
          if (cardOnPage === 0) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text(
              `Planche A4 HD (300 DPI) • Mode: ${modeLabel} • Page ${pageIndex + 1} • Format carte: ${cardW}x${cardH}mm`,
              startX,
              Math.max(5, startY - 3)
            );
          }

          pdf.addImage(face.imgData, "PNG", posX, posY, cardW, cardH);
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.15);
          pdf.rect(posX, posY, cardW, cardH);

          // Tiny side indicator below card on A4 sheet
          pdf.setFontSize(5.5);
          pdf.setTextColor(148, 163, 184);
          pdf.text(
            `${face.studentName} (${face.side.toUpperCase()})`,
            posX + 1,
            posY + cardH + 2.2
          );
        });

        const suffix =
          targetStudentsToPrint.length === 1
            ? `${targetStudentsToPrint[0].nomEtudiant || "Eleve"}`.replace(/\s+/g, "_")
            : selectedClassFilter !== "ALL"
            ? `Classe_${selectedClassFilter.replace(/\s+/g, "_")}`
            : `Lot_${targetStudentsToPrint.length}_Eleves`;

        pdf.save(`Planche_A4_${printSidesMode.toUpperCase()}_${suffix}.pdf`);
      }

      toast.success(
        `PDF Haute Précision (${modeLabel}) généré avec succès ! (${targetStudentsToPrint.length} élève(s), ${capturedFaces.length} face(s))`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error("Print Error:", err);
      toast.error("Erreur lors de la génération PDF HD", { id: toastId });
    } finally {
      setPrinting(false);
    }
  };

  // Export High-Resolution PNG Images (Recto & Verso)
  const handleExportHighDPImages = async () => {
    if (targetStudentsToPrint.length === 0) {
      toast.error("Veuillez sélectionner au moins un élève.");
      return;
    }
    setPrinting(true);
    const toastId = toast.loading("Exportation des images PNG Ultra-HD (300+ DPI)...");
    try {
      await new Promise((r) => setTimeout(r, 150));
      const capturedFaces = await captureBatchCardsHighDPI();
      for (const face of capturedFaces) {
        const link = document.createElement("a");
        const safeName = face.studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
        link.download = `Carte_${safeName}_${face.side.toUpperCase()}_300DPI.png`;
        link.href = face.imgData;
        link.click();
        await new Promise((r) => setTimeout(r, 180));
      }
      toast.success(`${capturedFaces.length} image(s) PNG Ultra-HD téléchargée(s) !`, { id: toastId });
    } catch (err) {
      console.error("Image export error:", err);
      toast.error("Erreur lors de l'exportation d'image HD", { id: toastId });
    } finally {
      setPrinting(false);
    }
  };

  const countWithPhoto = useMemo(() => students.filter((s) => isValidPhoto(s.photoPath)).length, [students]);
  const countNoPhoto = useMemo(() => students.filter((s) => !isValidPhoto(s.photoPath)).length, [students]);

  return (
    <div className="h-screen bg-slate-100 dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Hidden File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => uploadingStudentId && handlePhotoUpload(uploadingStudentId, e)}
        className="hidden"
      />

      {/* Top Header Bar with Main Tabs */}
      <header className="h-16 bg-white dark:bg-[#131622] border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-none">Studio Cartes ID</h1>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pro Recto-Verso
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-0.5">
              Génération par classe ou élève • Export PDF & Image Ultra-HD 300+ DPI
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs: Design | Données | Impression */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("design")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "design"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <Sparkles size={14} /> Design
          </button>
          <button
            onClick={() => setActiveTab("données")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "données"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <FileText size={14} /> Données ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("impression")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "impression"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            }`}
          >
            <Printer size={14} /> Impression & Export HD ({targetStudentsToPrint.length})
          </button>
        </div>

        {/* Quick Recto-Verso PDF & Print Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black">
            <button
              onClick={() => setPrintSidesMode("recto-verso")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                printSidesMode === "recto-verso"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
              title="Exporter/Imprimer Recto et Verso"
            >
              Recto-Verso
            </button>
            <button
              onClick={() => setPrintSidesMode("recto")}
              className={`px-2 py-1.5 rounded-lg transition ${
                printSidesMode === "recto"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Recto
            </button>
            <button
              onClick={() => setPrintSidesMode("verso")}
              className={`px-2 py-1.5 rounded-lg transition ${
                printSidesMode === "verso"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Verso
            </button>
          </div>

          <Button
            onClick={() => handleBatchPrintPDF(false)}
            disabled={printing}
            className="h-10 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2"
          >
            {printing ? <RefreshCw size={15} className="animate-spin" /> : <FileDown size={15} />}
            {printing
              ? "Génération HD..."
              : `PDF ${printSidesMode === "recto-verso" ? "Recto-Verso" : printSidesMode.toUpperCase()} (${targetStudentsToPrint.length})`}
          </Button>

          <Button
            onClick={() => handleBatchPrintPDF(true)}
            disabled={printing}
            variant="outline"
            className="h-10 px-3.5 rounded-2xl border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5"
            title="Imprimer directement en haute précision 300 DPI"
          >
            <Printer size={15} /> Imprimer
          </Button>
        </div>
      </header>

      {/* Main Container Layout: Left Student Selection Panel + Tab View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: SÉLECTION DES ÉLÈVES & CLASSES */}
        <aside className="w-80 bg-white dark:bg-[#131622] border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full z-20 shadow-sm">
          {/* Sidebar Header & Counter */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={14} className="text-indigo-600" /> Élèves & Classes
            </h3>
            <div className="flex items-center gap-1.5">
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedStudentIds([]);
                    setPrintScope("single");
                  }}
                  className="text-[10px] font-bold text-rose-600 hover:underline px-1.5 py-0.5"
                  title="Réinitialiser la sélection"
                >
                  Vider
                </button>
              )}
              <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-800">
                {selectedStudentIds.length} sél.
              </span>
            </div>
          </div>

          {/* Class Selector & 1-Click Whole Class Generation */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                Filtrer / Générer par Classe
              </label>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {availableClasses.length} classe(s)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassFilter(val);
                  if (filterType === "selected" && selectedStudentIds.length === 0) {
                    setFilterType("all");
                  }
                }}
                className="flex-1 h-9 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Toutes les classes ({students.length})</option>
                {availableClasses.map((cls) => {
                  const count = students.filter((s) => String(s.classe || "").trim() === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} ({count} élève{count > 1 ? "s" : ""})
                    </option>
                  );
                })}
              </select>
              <button
                onClick={() => handleSelectEntireClass(selectedClassFilter)}
                className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black whitespace-nowrap shadow-sm transition flex items-center gap-1"
                title="Sélectionner toute cette classe pour générer toutes ses cartes"
              >
                <Check size={12} /> Toute la classe
              </button>
            </div>
          </div>

          {/* Search Bar & Filter Chips */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131622]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <Input
                type="text"
                placeholder="Nom, matricule, classe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 mt-2.5">
              <button
                onClick={() => setFilterType("all")}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition ${
                  filterType === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Tous ({students.length})
              </button>
              <button
                onClick={() => setFilterType("selected")}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition ${
                  filterType === "selected"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Sél. ({selectedStudentIds.length})
              </button>
              <button
                onClick={() => setFilterType("no-photo")}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition ${
                  filterType === "no-photo"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Sans photo ({countNoPhoto})
              </button>
            </div>
          </div>

          {/* Select All Checkbox Bar */}
          <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredStudents.length > 0 &&
                  filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Tout sélectionner ({filteredStudents.length})
              </span>
            </label>
            <button
              onClick={() => {
                if (activeStudent) {
                  setSelectedStudentIds([activeStudent.id]);
                  setPrintScope("single");
                  toast.info(`Mode Élève unique : ${activeStudent.nomEtudiant}`);
                }
              }}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
              title="Sélectionner uniquement l'élève actif"
            >
              1 Élève seul
            </button>
          </div>

          {/* Student Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold animate-pulse">
                Chargement de la liste des élèves...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-slate-400 text-xs font-bold">
                  {filterType === "selected"
                    ? "Aucun élève n'est encore coché dans la sélection."
                    : "Aucun élève trouvé pour ce filtre."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilterType("all");
                    setSelectedClassFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="rounded-xl text-xs font-black border-indigo-200 text-indigo-600"
                >
                  Afficher tous les élèves ({students.length})
                </Button>
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                const isPreviewing = previewStudentId === st.id;
                const hasPhoto = isValidPhoto(st.photoPath);

                let photoUrl = hasPhoto ? st.photoPath : null;
                if (photoUrl && (photoUrl.startsWith("C:") || photoUrl.startsWith("file:"))) {
                  photoUrl = `/api/files?path=${encodeURIComponent(photoUrl)}`;
                }

                return (
                  <div
                    key={st.id}
                    onClick={() => setPreviewStudentId(st.id)}
                    className={`p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer group ${
                      isPreviewing
                        ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 shadow-sm"
                        : "bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleStudentSelection(st.id);
                        }}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                      />

                      <div className="relative w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {hasPhoto && photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={st.nomEtudiant}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                            {st.nomEtudiant?.[0] || "E"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-black truncate leading-snug ${
                            isPreviewing
                              ? "text-indigo-950 dark:text-indigo-200"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {st.nomEtudiant} {st.prenomEtudiant}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                          {st.classe || "Classe N/A"} • <span className="font-mono">{st.numAdmission || "N/A"}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {hasPhoto ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Prêt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Photo manquante
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Content Panel (Design | Données | Impression) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0b0d14]">
          {/* Keep CardDesigner mounted so custom designs & active preset persist across tabs */}
          <div className={activeTab === "design" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
            <CardDesigner
              externalStudents={students}
              externalPreviewStudentId={previewStudentId}
              onExternalPreviewStudentChange={setPreviewStudentId}
              externalActiveBranch={activeBranch}
              onOpenBatchPrintHub={() => setActiveTab("impression")}
              onDesignStateChange={handleDesignStateChange}
            />
          </div>

          {activeTab === "données" && (
            /* Tab 2: Students Data Table & Photo Management */
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="bg-white dark:bg-[#131622] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Données des élèves pour les cartes d'identité
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Gérez les photos, matricules et vérifiez l'état de préparation des cartes scolaires.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-100 dark:border-emerald-800">
                    {countWithPhoto} avec photo
                  </span>
                  <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-100 dark:border-amber-800">
                    {countNoPhoto} photos manquantes
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Élève</th>
                      <th className="py-3.5 px-4">Matricule</th>
                      <th className="py-3.5 px-4">Classe</th>
                      <th className="py-3.5 px-4">Genre</th>
                      <th className="py-3.5 px-4">Statut Photo</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                    {filteredStudents.map((st) => {
                      const hasPhoto = isValidPhoto(st.photoPath);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              {hasPhoto && st.photoPath ? (
                                <img
                                  src={
                                    st.photoPath.startsWith("http") || st.photoPath.startsWith("data:")
                                      ? st.photoPath
                                      : `/api/files?path=${encodeURIComponent(st.photoPath)}`
                                  }
                                  alt={st.nomEtudiant}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                                  {st.nomEtudiant?.[0] || "E"}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {st.nomEtudiant} {st.prenomEtudiant}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">{st.numAdmission || "N/A"}</td>
                          <td className="py-3 px-4">{st.classe || "Non assignée"}</td>
                          <td className="py-3 px-4">{st.sexe || "N/A"}</td>
                          <td className="py-3 px-4">
                            {hasPhoto ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-[10px] border border-emerald-100 dark:border-emerald-800">
                                <CheckCircle2 size={12} /> Prêt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full font-bold text-[10px] border border-amber-100 dark:border-amber-800">
                                <AlertCircle size={12} /> Photo manquante
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => triggerUploadFor(st.id)}
                                className="rounded-xl font-bold text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800"
                              >
                                <Upload size={12} className="mr-1" /> Photo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewStudentId(st.id);
                                  setActiveTab("design");
                                }}
                                className="rounded-xl font-bold text-[11px] border-slate-200 dark:border-slate-700"
                              >
                                <Eye size={13} className="mr-1" /> Aperçu Carte
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Always-mounted Print & Export Hub (visible in "impression" tab, offscreen when in "design"/"données" so top-bar PDF button always works) */}
          <div
            className={
              activeTab === "impression"
                ? "flex-1 overflow-y-auto p-6 space-y-6"
                : "fixed -left-[9999px] top-0 w-[1280px] overflow-hidden pointer-events-none opacity-0"
            }
          >
            {/* Control Deck for Batch & Single Recto-Verso Printing */}
            <div className="bg-white dark:bg-[#131622] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Centre d'Exportation PDF & Impression Haute Précision (300+ DPI)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Recto-Verso Automatique
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Modèle actif : <strong className="text-indigo-600 dark:text-indigo-400">{studioDesign.templateName}</strong> •{" "}
                    {targetStudentsToPrint.length} élève(s) ciblé(s) × {targetSides.length} face(s) ={" "}
                    <strong>{targetStudentsToPrint.length * targetSides.length} face(s) HD</strong>
                  </p>
                </div>

                {/* Primary Export & Print Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    onClick={handleExportHighDPImages}
                    disabled={printing}
                    variant="outline"
                    className="h-10 px-4 rounded-2xl border-slate-200 dark:border-slate-700 font-black text-xs flex items-center gap-2"
                  >
                    <ImageIcon size={15} className="text-indigo-600" /> Images PNG (300 DPI)
                  </Button>
                  <Button
                    onClick={() => handleBatchPrintPDF(true)}
                    disabled={printing}
                    variant="outline"
                    className="h-10 px-4 rounded-2xl border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-2"
                  >
                    <Printer size={15} /> Imprimer Directement
                  </Button>
                  <Button
                    onClick={() => handleBatchPrintPDF(false)}
                    disabled={printing}
                    className="h-10 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2"
                  >
                    {printing ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                    Télécharger PDF {printSidesMode === "recto-verso" ? "Recto-Verso" : printSidesMode.toUpperCase()} (300 DPI)
                  </Button>
                </div>
              </div>

              {/* 4-Column Configuration Bar: Cible | Faces (Recto-Verso) | Format PDF | Style */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* 1. Scope: Single Student vs Whole Class vs Selected */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    1. Lot à générer
                  </label>
                  <select
                    value={printScope}
                    onChange={(e) => setPrintScope(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-100"
                  >
                    <option value="auto">
                      Automatique ({targetStudentsToPrint.length} élève{targetStudentsToPrint.length > 1 ? "s" : ""})
                    </option>
                    <option value="single">
                      Élève unique ({activeStudent?.nomEtudiant || "Actif"})
                    </option>
                    <option value="class">
                      Toute la classe ({selectedClassFilter !== "ALL" ? selectedClassFilter : activeStudent?.classe || "Classe"})
                    </option>
                    <option value="selected">
                      Élèves cochés ({selectedStudents.length})
                    </option>
                  </select>
                </div>

                {/* 2. Side Mode: Recto-Verso Duplex vs Recto vs Verso */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    2. Faces d'impression
                  </label>
                  <select
                    value={printSidesMode}
                    onChange={(e) => setPrintSidesMode(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-indigo-700 dark:text-indigo-300"
                  >
                    <option value="recto-verso">Recto + Verso (Duplex Complet)</option>
                    <option value="recto">Recto uniquement (Face Avant)</option>
                    <option value="verso">Verso uniquement (Face Arrière)</option>
                  </select>
                </div>

                {/* 3. Output Format: CR80 Card Printer vs A4 Sheet */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    3. Format du fichier PDF
                  </label>
                  <select
                    value={pdfPageFormat}
                    onChange={(e) => setPdfPageFormat(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-100"
                  >
                    <option value="cr80-individual">Carte PVC CR80 (85.6×54mm • 1 face/page)</option>
                    <option value="a4-grid">Planche A4 Paysage (Grille multi-cartes)</option>
                  </select>
                </div>

                {/* 4. Template Style */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    4. Modèle Graphique
                  </label>
                  <select
                    value={renderTemplateStyle}
                    onChange={(e) => setRenderTemplateStyle(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-100"
                  >
                    <option value="studio">Modèle Studio Actif ({studioDesign.templateName})</option>
                    <option value="classic">Carte Académique Classique</option>
                  </select>
                </div>
              </div>
            </div>

            {/* High Resolution Print Grid Container */}
            <div
              ref={printRef}
              className="bg-white dark:bg-[#131622] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col items-center space-y-6"
            >
              {targetStudentsToPrint.map((st, idx) => {
                const fullName = `${st.nomEtudiant || ""} ${st.prenomEtudiant || ""}`.trim();
                return (
                  <div
                    key={st.id}
                    className="w-full max-w-5xl p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{fullName}</span>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg">
                          {st.numAdmission || "N/A"}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          • Classe : {st.classe || "N/A"}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {printSidesMode === "recto-verso" ? "Recto + Verso (Duplex)" : printSidesMode.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-8 pt-2">
                      {targetSides.map((side) => (
                        <div key={`${st.id}-${side}`} className="flex flex-col items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {side === "recto" ? "FACE AVANT (RECTO)" : "FACE ARRIÈRE (VERSO)"}
                          </span>

                          {/* Exact DOM node captured at scale: 4 (300+ DPI) */}
                          <div
                            data-student-name={fullName}
                            data-matricule={st.numAdmission || ""}
                            data-classe={st.classe || ""}
                            data-side={side}
                            className="batch-print-card-face shadow-lg rounded-2xl overflow-hidden bg-white"
                          >
                            {renderTemplateStyle === "studio" ? (
                              <CardCanvas
                                elements={
                                  side === "recto"
                                    ? studioDesign.rectoElements
                                    : studioDesign.versoElements
                                }
                                selectedId={null}
                                onSelect={() => {}}
                                onUpdateElement={() => {}}
                                cardType={studioDesign.cardType}
                                orientation={studioDesign.orientation}
                                zoom={135}
                                showGrid={false}
                                showRulers={false}
                                snapToGrid={false}
                                activeStudent={st}
                                activeBranch={activeBranch}
                                readOnly={true}
                              />
                            ) : (
                              <StudentCard
                                student={st}
                                schoolName={
                                  activeBranch?.nomBranch ||
                                  activeBranch?.branchName ||
                                  "CES BOURJA MARADI"
                                }
                                academicYear="2025-2026"
                                side={side}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
