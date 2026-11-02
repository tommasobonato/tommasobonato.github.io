%% The MIT License (MIT)
%%
%% Copyright (c) 2015 Daniil Belyakov
%%
%% Permission is hereby granted, free of charge, to any person obtaining a copy
%% of this software and associated documentation files (the "Software"), to deal
%% in the Software without restriction, including without limitation the rights
%% to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
%% copies of the Software, and to permit persons to whom the Software is
%% furnished to do so, subject to the following conditions:
%%
%% The above copyright notice and this permission notice shall be included in all
%% copies or substantial portions of the Software.
%%
%% THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
%% IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
%% FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
%% AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
%% LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
%% OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
%% SOFTWARE.
\ProvidesClass{mcdowellcv}[2026/11/02 v2.2 Single-column public resume class]
\LoadClass[letterpaper,10pt]{article}

\RequirePackage{iftex}
\ifPDFTeX
    \RequirePackage[utf8]{inputenc}
    \input{glyphtounicode}
    \pdfgentounicode=1
\fi
\RequirePackage[T1]{fontenc}
\RequirePackage{lmodern}
\RequirePackage[left=0.7in,right=0.7in,top=0.55in,bottom=0.55in]{geometry}
\RequirePackage{enumitem}
\RequirePackage{etoolbox}
\newcommand{\award}[1]{\textbf{#1}}

\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\AtBeginDocument{\fontsize{10.5pt}{12pt}\selectfont\raggedright}
\setlist[itemize]{leftmargin=1.2em,label=\textbullet,
    itemsep=1.5pt,parsep=0pt,topsep=3pt,partopsep=0pt}
\clubpenalty=10000
\widowpenalty=10000
\hyphenpenalty=10000
\exhyphenpenalty=10000
\raggedbottom

\newcommand{\name}[1]{\def\@name{#1}}
\newcommand{\contacts}[1]{\def\@contacts{#1}}
\name{}
\contacts{}

\newcommand{\makeheader}{%
    \begingroup
    \centering
    {\LARGE\bfseries \@name\par}
    \vspace{3pt}
    \@contacts\par
    \endgroup
    \vspace{3pt}
}

\newenvironment{cvsection}[1]{%
    \par\addvspace{10pt}
    {\bfseries #1\par}
    \nobreak\vspace{2pt}
    \hrule height 0.4pt
    \nobreak\vspace{3pt}
}{\par}

\newenvironment{cvsubsection}[4][1]{%
    \par\addvspace{6pt}
    \ifblank{#2#3#4}{}{%
        {\bfseries #3\enspace\textbar\enspace #2}%
        \hfill\mbox{#4}\par\nobreak
    }%
}{\par}
